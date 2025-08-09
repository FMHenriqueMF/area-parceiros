// src/context/AuthContext.jsx

import React, { useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { recalculateAndSaveScore } from '../utils/scoreManager';
import LegalModal from '../components/LegalModal';
import OnboardingModal from '../components/OnboardingModal';
import { requestNotificationPermission } from '../utils/push-notifications';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const CURRENT_LEGAL_VERSION = 'v2.0';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // AGORA DEVE COMEÇAR COMO TRUE
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(null);
  const isUpdating = useRef(false);

  const checkAndRequestNotificationPermission = async () => {
    if (currentUser && hasNotificationPermission !== 'granted') {
      const permissionStatus = await Notification.requestPermission();
      setHasNotificationPermission(permissionStatus);
      if (permissionStatus === 'granted') {
        await requestNotificationPermission(currentUser.uid);
      }
    }
  };

  useEffect(() => {
    let unsubscribeFromUser;
    let unsubscribeFromLock;
    let unsubscribeFromActiveService;

    const unsubscribeFromAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeFromUser) unsubscribeFromUser();
      if (unsubscribeFromLock) unsubscribeFromLock();
      if (unsubscribeFromActiveService) unsubscribeFromActiveService();

      try {
        if (user) {
          const userDocRef = doc(db, 'usuarios', user.uid);
          
          unsubscribeFromUser = onSnapshot(userDocRef, async (docSnap) => {
            if (isUpdating.current) return;
            try {
              if (docSnap.exists()) {
                const data = docSnap.data();
                const fullUserData = { uid: user.uid, email: user.email, ...data };
                setCurrentUser(fullUserData);

                setHasNotificationPermission(Notification.permission);
                
                const acceptedLegal = data.legalAccepted === true && data.legalVersion === CURRENT_LEGAL_VERSION;
                if (!acceptedLegal) {
                  setShowLegalModal(true);
                  setShowOnboardingModal(false);
                } else {
                  setShowLegalModal(false);
                  if (data.onboardingCompleted === false) {
                    setShowOnboardingModal(true);
                  } else {
                    setShowOnboardingModal(false);
                  }
                }

                const { historico_qualidade, historico_confiabilidade, historico_garantia, nota_final_unificada } = data;
                const mediaQualidade = (historico_qualidade || []).reduce((a, b) => a + b, 0) / (historico_qualidade?.length || 1);
                const mediaConfiabilidade = (historico_confiabilidade || []).reduce((a, b) => a + b, 0) / (historico_confiabilidade?.length || 1);
                const mediaGarantia = (historico_garantia || []).reduce((a, b) => a + b, 0) / (historico_garantia?.length || 1);
                let expectedFinalScore;
                const isProbationary = (historico_confiabilidade || []).length < 20;
                if (isProbationary) {
                  const severeInfractions = (historico_confiabilidade || []).filter(score => score === 1).length;
                  expectedFinalScore = severeInfractions >= 2 ? 1.0 : Math.min(mediaQualidade, mediaConfiabilidade, mediaGarantia);
                } else {
                  expectedFinalScore = (mediaQualidade + mediaConfiabilidade + mediaGarantia) / 3;
                }
                const expectedFinalScoreClamped = parseFloat(Math.max(0, Math.min(10, expectedFinalScore)).toFixed(2));
                if (nota_final_unificada !== expectedFinalScoreClamped) {
                  isUpdating.current = true;
                  await recalculateAndSaveScore(db, user.uid, {});
                  setTimeout(() => { isUpdating.current = false; }, 200);
                }
              } else {
                setCurrentUser(user);
              }
              setLoading(false);
            } catch (error) {
              console.error("Erro ao carregar dados do usuário:", error);
              setLoading(false);
            }
          });

          const activeServiceQuery = query(
            collection(db, 'clientes'),
            where('aceito_por_uid', '==', user.uid),
            where('status', 'in', ['deslocamento', 'cheguei', 'aguardandopagamento'])
          );
          unsubscribeFromActiveService = onSnapshot(activeServiceQuery, (snapshot) => {
            if (!snapshot.empty) {
              const activeDoc = snapshot.docs[0];
              setIsAppLocked(true);
              setActiveServiceId(activeDoc.id);
            } else {
              setIsAppLocked(false);
              setActiveServiceId(null);
            }
          });
        } else {
          setCurrentUser(null);
          setIsAppLocked(false);
          setActiveServiceId(null);
          setLoading(false);
          setShowLegalModal(false);
          setShowOnboardingModal(false);
          setHasNotificationPermission(null);
        }
      } catch (error) {
        console.error("Erro fatal no AuthContext:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromUser) unsubscribeFromUser();
      if (unsubscribeFromLock) unsubscribeFromLock();
      if (unsubscribeFromActiveService) unsubscribeFromActiveService();
    };
  }, []);

  const handleAcceptLegal = async () => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'usuarios', currentUser.uid);
      await updateDoc(userRef, {
        legalAccepted: true,
        legalVersion: CURRENT_LEGAL_VERSION
      });
      setShowLegalModal(false);
    } catch (error) {
      console.error("Erro ao aceitar os documentos legais:", error);
      alert("Não foi possível salvar a sua aceitação. Tente novamente.");
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!currentUser) return;
    try {
        const userRef = doc(db, 'usuarios', currentUser.uid);
        await updateDoc(userRef, { onboardingCompleted: true });
        setShowOnboardingModal(false);
    } catch (error) {
        console.error("Erro ao concluir o onboarding:", error);
        alert("Não foi possível salvar a conclusão do onboarding. Tente novamente.");
    }
  };

  const value = { currentUser, loading, isAppLocked, activeServiceId, hasNotificationPermission, checkAndRequestNotificationPermission };

  return (
    <AuthContext.Provider value={value}>
      {!loading && showLegalModal && <LegalModal onAccept={handleAcceptLegal} />}
      {!loading && !showLegalModal && showOnboardingModal && <OnboardingModal onComplete={handleCompleteOnboarding} />}
      {!loading && !showLegalModal && !showOnboardingModal && children}
    </AuthContext.Provider>
  );
}