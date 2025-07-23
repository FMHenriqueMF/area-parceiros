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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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

  const value = {
    currentUser,
    loading,
    isAppLocked,
    activeServiceId,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider> // <-- LINHA CORRIGIDA
  );
}