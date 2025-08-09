// src/components/CompleteOnboardingButton.jsx

import React from 'react';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../utils/logger';

const CompleteOnboardingButton = () => {
  const { currentUser } = useAuth();
  
  const handleUpdateOnboarding = async () => {
    // Confirmação para evitar rodar acidentalmente
    const confirmar = window.confirm("Tem certeza que deseja marcar 'onboardingCompleted' como TRUE para TODOS os usuários?");
    if (!confirmar) {
      return;
    }

    try {
      // Pega uma referência para a coleção 'usuarios'
      const usuariosRef = collection(db, 'usuarios');
      
      // Pega todos os documentos da coleção
      const querySnapshot = await getDocs(usuariosRef);
      
      // Cria um batch para fazer as atualizações em massa
      const batch = writeBatch(db);

      // Percorre cada documento e adiciona a atualização ao batch
      querySnapshot.forEach((documento) => {
        const docRef = doc(db, 'usuarios', documento.id);
        batch.update(docRef, {
          onboardingCompleted: true
        });
      });

      // Commit o batch para salvar todas as atualizações de uma vez
      await batch.commit();

      alert("Campo 'onboardingCompleted' atualizado para TRUE com sucesso para todos os usuários!");
      if (currentUser) {
        logUserActivity(currentUser.uid, 'Marcou onboardingCompleted como TRUE para todos os usuários');
      }
    } catch (error) {
      console.error("Erro ao atualizar os usuários:", error);
      alert('Erro ao atualizar o campo. Verifique o console.');
    }
  };

  return (
    <div className="md:col-span-2 mt-8">
      <button
        onClick={handleUpdateOnboarding}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
      >
        Marcar Onboarding como Concluído (para todos os usuários)
      </button>
    </div>
  );
};

export default CompleteOnboardingButton;