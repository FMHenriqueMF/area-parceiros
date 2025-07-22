// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuário está logado, vamos buscar suas permissões
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          // Anexa os dados do Firestore ao objeto do usuário
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          // Usuário autenticado mas sem perfil no Firestore
          setCurrentUser(user); // Ou null, dependendo da sua regra de negócio
        }
      } else {
        // Usuário está deslogado
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}