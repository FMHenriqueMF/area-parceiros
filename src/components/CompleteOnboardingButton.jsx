// src/components/CompleteOnboardingButton.jsx

import React from 'react';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../utils/logger';

const CompleteOnboardingButton = () => {
  const { currentUser } = useAuth();
  
  const handleUpdateUsers = async () => {
    // Confirmação para evitar rodar acidentalmente
    const confirmar = window.confirm("Tem certeza que deseja atualizar o campo 'historico_qualidade' para todos os usuários?");
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
        
        // Pega os dados atuais do documento
        const dadosUsuario = documento.data();
        
        // Verifica se o array 'historico_qualidade' existe e tem pelo menos um item
        if (dadosUsuario.historico_qualidade && Array.isArray(dadosUsuario.historico_qualidade) && dadosUsuario.historico_qualidade.length > 0) {
          // Cria uma cópia do array para não alterar o original diretamente
          const novoHistorico = [...dadosUsuario.historico_qualidade];
          
          // Atualiza o valor do índice 0 para 10
          novoHistorico[0] = 10;
          
          // Adiciona a atualização ao batch
          batch.update(docRef, {
            historico_qualidade: novoHistorico
          });
        }
      });

      // Commit o batch para salvar todas as atualizações de uma vez
      await batch.commit();

      alert("Campo 'historico_qualidade' atualizado para todos os usuários!");
      if (currentUser) {
        logUserActivity(currentUser.uid, "Atualizou 'historico_qualidade' para todos os usuários");
      }
    } catch (error) {
      console.error("Erro ao atualizar os usuários:", error);
      alert('Erro ao atualizar o campo. Verifique o console.');
    }
  };

  return (
    <div className="md:col-span-2 mt-8">
      <button
        onClick={handleUpdateUsers}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
      >
        Atualizar Histórico de Qualidade (para todos os usuários)
      </button>
    </div>
  );
};

export default CompleteOnboardingButton;