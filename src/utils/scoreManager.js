// src/utils/scoreManager.js

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Adds a new event to a history array, keeping a limit of 100 entries.
 * @param {Array<number>} currentHistory - The current history array.
 * @param {number} newEventScore - The new score to add.
 * @returns {Array<number>} The new history array.
 */
const updateHistoryList = (currentHistory = [], newEventScore) => {
    const newHistory = [newEventScore, ...currentHistory];
    if (newHistory.length > 100) newHistory.pop();
    return newHistory;
};

/**
 * The core function that recalculates ALL of a partner's scores and saves them to Firestore.
 * This is the heart of our scoring system.
 * @param {FirebaseFirestore} db - The Firestore instance.
 * @param {string} partnerId - The ID of the partner to update.
 * @param {object} updatedHistories - An object containing the histories that were modified.
 * Ex: { historico_confiabilidade: newReliabilityArray }
 */
export const recalculateAndSaveScore = async (db, partnerId, updatedHistories) => {
    const partnerRef = doc(db, "usuarios", partnerId);
    const partnerSnap = await getDoc(partnerRef);

    if (!partnerSnap.exists()) {
        console.error("Partner not found for score recalculation.");
        return;
    }

    const currentData = partnerSnap.data();
    // Merge current data with the histories that were just updated
    const data = { ...currentData, ...updatedHistories };

    const { historico_qualidade, historico_confiabilidade, historico_garantia } = data;

    // Calculate individual averages
    const mediaQualidade = (historico_qualidade || []).reduce((a, b) => a + b, 0) / (historico_qualidade?.length || 1);
    const mediaConfiabilidade = (historico_confiabilidade || []).reduce((a, b) => a + b, 0) / (historico_confiabilidade?.length || 1);
    const mediaGarantia = (historico_garantia || []).reduce((a, b) => a + b, 0) / (historico_garantia?.length || 1);

    // Calculate the unified final score with all rules
    let notaFinal;
    const isProbationary = (historico_confiabilidade || []).length < 20;

    if (isProbationary) {
        const severeInfractions = (historico_confiabilidade || []).filter(score => score === 1).length;
        if (severeInfractions >= 2) {
            notaFinal = 1.0; // Immediate ban
        } else {
            notaFinal = Math.min(mediaQualidade, mediaConfiabilidade, mediaGarantia);
        }
    } else {
        notaFinal = (mediaQualidade + mediaConfiabilidade + mediaGarantia) / 3;
    }
    
    const finalScoreClamped = parseFloat(Math.max(0, Math.min(10, notaFinal)).toFixed(2));

    // Prepare the update payload for Firestore
    const updatePayload = {
        ...updatedHistories,
        nota_qualidade: parseFloat(mediaQualidade.toFixed(2)),
        nota_confiabilidade: parseFloat(mediaConfiabilidade.toFixed(2)),
        nota_garantia: parseFloat(mediaGarantia.toFixed(2)),
        nota_final_unificada: finalScoreClamped
    };

    // --- NEW 3-STRIKE BAN LOGIC ---
    // Check if the user should be suspended or permanently banned
    if (finalScoreClamped <= 3 && !currentData.is_permanently_banned) {
        // Only trigger a new suspension if they aren't already in a cooldown period.
        // This prevents re-triggering the logic while they are already suspended.
        if (!currentData.banned_at) {
            const currentStrikes = currentData.suspension_count || 0;
            
            if (currentStrikes >= 2) { // This is the third strike, time for a permanent ban.
                updatePayload.is_permanently_banned = true;
                updatePayload.banned_at = null; // Clear temporary ban timestamp if it exists
            } else { // This is strike 1 or 2, a temporary suspension.
                updatePayload.suspension_count = currentStrikes + 1;
                updatePayload.banned_at = serverTimestamp(); // Set the start of the 7-day countdown
            }
        }
    }
    // Note: The unban process is manual via WhatsApp. An admin will need to remove
    // the `banned_at` field. The `suspension_count` will remain, tracking their history.

    await updateDoc(partnerRef, updatePayload);
};


/**
 * Convenience function for reliability events.
 * It updates the history and calls the main recalculator.
 * @param {FirebaseFirestore} db - The Firestore instance.
 * @param {string} partnerId - The partner's ID.
 * @param {number} score - The score of the new reliability event.
 */
export const addReliabilityEvent = async (db, partnerId, score) => {
    const partnerRef = doc(db, "usuarios", partnerId);
    const partnerSnap = await getDoc(partnerRef);
    if (partnerSnap.exists()) {
        const currentHistory = partnerSnap.data().historico_confiabilidade || [];
        const newHistory = updateHistoryList(currentHistory, score);
        await recalculateAndSaveScore(db, partnerId, { historico_confiabilidade: newHistory });
    }
};

// You can create similar functions for 'addQualityEvent' and 'addWarrantyEvent'
