// src/utils/push-notifications.js

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '../firebase'; // Importa sua instância do DB

/**
 * Solicita permissão para notificações e salva o token do dispositivo.
 * @param {string} userId - O ID do usuário logado.
 */
export const requestNotificationPermission = async (userId) => {
  try {
    const messaging = getMessaging();
    
    // Pede permissão ao usuário
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Permissão para notificação concedida.");

      // Pega o token do dispositivo.
      const currentToken = await getToken(messaging, {
        vapidKey: "BBaIyOHPVBpr4NmViUNnkLfq6Y03hmLf66j0XzEhEDxGkJZ971m8nDvB5dya1N3uwMODJjQF9pRoFyC7AVFxcFc", // Sua VAPID Key do Firebase
      });

      if (currentToken) {
        console.log("Token do dispositivo:", currentToken);
        console.log("Tentando salvar o token para o usuário com ID:", userId); // <-- LOG DE DEBUG

        // Bloco try/catch específico para a operação com o Firestore
        try {
          const userDocRef = doc(db, "usuarios", userId);
          
          await updateDoc(userDocRef, {
            // Usa arrayUnion para adicionar o token sem duplicar.
            fcmTokens: arrayUnion(currentToken),
          });

          console.log("%cToken salvo no Firestore com sucesso!", "color: green; font-weight: bold;"); // <-- LOG DE SUCESSO

        } catch (firestoreError) {
          console.error("### ERRO AO SALVAR NO FIRESTORE ###");
          console.error("Código do Erro:", firestoreError.code);
          console.error("Mensagem do Erro:", firestoreError.message);
          console.error("Verifique suas Regras de Segurança (Rules) no console do Firebase!");
          console.error("Detalhes completos do erro:", firestoreError);
        }

      } else {
        console.log("Não foi possível obter o token de registro. Permissão foi concedida?");
      }
    } else {
      console.log("Permissão para notificação negada.");
    }

    // Ouve por mensagens enquanto o app está em primeiro plano
    onMessage(messaging, (payload) => {
        console.log('Mensagem recebida em primeiro plano: ', payload);
        // Aqui você pode mostrar um toast ou um alerta customizado dentro do app
        alert(payload.notification.title + "\n" + payload.notification.body);
    });

  } catch (error) {
    console.error("Ocorreu um erro geral ao solicitar permissão ou obter o token.", error);
  }
};