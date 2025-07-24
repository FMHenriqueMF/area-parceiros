// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState(null);

  useEffect(() => {
    // Este useEffect agora só lida com o LOGIN/LOGOUT
    const unsubscribeAuthState = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user); // Guarda o usuário da autenticação
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribeAuthState;
  }, []);

  // NOVO useEffect para buscar e ESCUTAR os dados do Firestore
  useEffect(() => {
    if (currentUser?.uid) {
      const userDocRef = doc(db, "usuarios", currentUser.uid);
      
      // onSnapshot para escutar as mudanças no documento do usuário
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          // Combina os dados da autenticação com os dados do Firestore
          setCurrentUser(prevUser => ({ ...prevUser, ...docSnap.data() }));
        }
      });

      return () => unsubscribeFirestore(); // Limpa o ouvinte
    }
  }, [currentUser?.uid]); // Roda sempre que o ID do usuário mudar (ou seja, no login)

  // useEffect do bloqueio do app (sem alterações)
  useEffect(() => {
    if (currentUser) {
      const lockedStatuses = ['deslocamento', 'cheguei', 'aguardandopagamento'];
      const q = query(
        collection(db, "clientes"),
        where("parceiroId", "==", currentUser.uid),
        where("status", "in", lockedStatuses)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const activeServiceDoc = snapshot.docs[0];
          setIsAppLocked(true);
          setActiveServiceId(activeServiceDoc.id);
        } else {
          setIsAppLocked(false);
          setActiveServiceId(null);
        }
      });
      return () => unsubscribe();
    } else {
      setIsAppLocked(false);
      setActiveServiceId(null);
    }
  }, [currentUser]);

  const value = { currentUser, loading, isAppLocked, activeServiceId };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}