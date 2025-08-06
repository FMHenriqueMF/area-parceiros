// src/utils/scoreManager.js

import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Adiciona um novo evento a um histórico, mantendo o limite de 100 entradas.
 * @param {Array<number>} historicoAtual - O array de histórico.
 * @param {number} notaNovoEvento - A nova nota a ser adicionada.
 * @returns {Array<number>} O novo array de histórico.
 */
const updateHistoryList = (historicoAtual = [], notaNovoEvento) => { // Garante que o histórico atual seja um array
    const novoHistorico = [notaNovoEvento, ...historicoAtual]; // Adiciona a nova nota no início
    if (novoHistorico.length > 100) novoHistorico.pop(); // Remove o último elemento se o tamanho exceder 100
    return novoHistorico; // Retorna o novo histórico
};

/**
 * A função central que recalcula TODAS as notas de um parceiro e as salva no Firestore.
 * Este é o coração do nosso sistema de pontuação.
 * @param {FirebaseFirestore} db - A instância do Firestore.
 * @param {string} partnerId - O ID do parceiro a ser atualizado.
 * @param {object} updatedHistories - Um objeto contendo os históricos que foram modificados.
 * Ex: { historico_confiabilidade: novoArrayDeConfiabilidade }
 */
export const recalculateAndSaveScore = async (db, partnerId, updatedHistories) => {
    const partnerRef = doc(db, "usuarios", partnerId);
    const partnerSnap = await getDoc(partnerRef);

    if (!partnerSnap.exists()) {
        console.error("Parceiro não encontrado para recálculo.");
        return;
    }

    const currentData = partnerSnap.data();
    // Mescla os históricos atuais com os que acabaram de ser atualizados
    const data = { ...currentData, ...updatedHistories };

    const { historico_qualidade, historico_confiabilidade, historico_garantia } = data;

    // Calcula as médias individuais
    const mediaQualidade = (historico_qualidade || []).reduce((a, b) => a + b, 0) / (historico_qualidade?.length || 1);
    const mediaConfiabilidade = (historico_confiabilidade || []).reduce((a, b) => a + b, 0) / (historico_confiabilidade?.length || 1);
    const mediaGarantia = (historico_garantia || []).reduce((a, b) => a + b, 0) / (historico_garantia?.length || 1);

    // Calcula a nota final unificada com todas as regras
    let notaFinal;
    const isProbationary = (historico_confiabilidade || []).length < 20;

    if (isProbationary) {
        const severeInfractions = (historico_confiabilidade || []).filter(score => score === 1).length;
        if (severeInfractions >= 2) {
            notaFinal = 1.0; // Banimento imediato
        } else {
            notaFinal = Math.min(mediaQualidade, mediaConfiabilidade, mediaGarantia);
        }
    } else {
        notaFinal = (mediaQualidade + mediaConfiabilidade + mediaGarantia) / 3;
    }
    
    const finalScoreClamped = parseFloat(Math.max(0, Math.min(10, notaFinal)).toFixed(2));

    // Prepara o objeto de atualização para o Firestore
    const updatePayload = {
        ...updatedHistories, // Salva os históricos que foram modificados
        nota_qualidade: parseFloat(mediaQualidade.toFixed(2)),
        nota_confiabilidade: parseFloat(mediaConfiabilidade.toFixed(2)),
        nota_garantia: parseFloat(mediaGarantia.toFixed(2)),
        nota_final_unificada: finalScoreClamped
    };

    await updateDoc(partnerRef, updatePayload);
    console.log(`QG DO BATMAN: Notas recalculadas e salvas para ${partnerId}. Nova nota final: ${finalScoreClamped}`);
};


/**
 * Função de conveniência para eventos de confiabilidade.
 * Ela atualiza o histórico e chama o recalculador principal.
 * @param {FirebaseFirestore} db - A instância do Firestore.
 * @param {string} partnerId - O ID do parceiro.
 * @param {number} score - A nota do novo evento de confiabilidade.
 */
export const addReliabilityEvent = async (db, partnerId, score) => {
    const partnerRef = doc(db, "usuarios", partnerId); // Referência ao documento do parceiro
    const partnerSnap = await getDoc(partnerRef); // Pega o snapshot do parceiro
    if (partnerSnap.exists()) { // Verifica se o parceiro existe
        const currentHistory = partnerSnap.data().historico_confiabilidade || []; // Pega o histórico atual ou cria um vazio
        const newHistory = updateHistoryList(currentHistory, score); // Atualiza o histórico com a nova nota
        await recalculateAndSaveScore(db, partnerId, { historico_confiabilidade: newHistory });
    }
};

// Você pode criar funções similares para 'addQualityEvent' e 'addWarrantyEvent'
