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
    // Verificar se notificações são suportadas
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return;
    }

    // Verificar se service workers são suportados
    if (!('serviceWorker' in navigator)) {
      console.log('Este navegador não suporta service workers');
      return;
    }

    const messaging = getMessaging();
    
    // Pede permissão ao usuário
    const permission = await Notification.requestPermission();

    if (permission === "granted") {

      // Tentar registrar o service worker manualmente se necessário
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service worker registrado com sucesso');
      } catch (swError) {
        console.warn('Erro ao registrar service worker:', swError);
        // Continuar mesmo se o service worker falhar
      }

      // Pega o token do dispositivo com timeout personalizado
      const currentToken = await Promise.race([
        getToken(messaging, {
          vapidKey: "BBaIyOHPVBpr4NmViUNnkLfq6Y03hmLf66j0XzEhEDxGkJZ971m8nDvB5dya1N3uwMODJjQF9pRoFyC7AVFxcFc", // Sua VAPID Key do Firebase
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao obter token FCM')), 15000)
        )
      ]);

      if (currentToken) {

        // Bloco try/catch específico para a operação com o Firestore
        try {
          const userDocRef = doc(db, "usuarios", userId);
          
          await updateDoc(userDocRef, {
            // Usa arrayUnion para adicionar o token sem duplicar.
            fcmTokens: arrayUnion(currentToken),
          });


        } catch (firestoreError) {
          console.error("### ERRO AO SALVAR NO FIRESTORE ###");
          console.error("Código do Erro:", firestoreError.code);
          console.error("Mensagem do Erro:", firestoreError.message);
          console.error("Verifique suas Regras de Segurança (Rules) no console do Firebase!");
          console.error("Detalhes completos do erro:", firestoreError);
        }

      } else {
      }
    } else {
    }

    // Ouve por mensagens enquanto o app está em primeiro plano
    onMessage(messaging, (payload) => {
        // Aqui você pode mostrar um toast ou um alerta customizado dentro do app
        alert(payload.notification.title + "\n" + payload.notification.body);
    });

  } catch (error) {
    console.error("Ocorreu um erro geral ao solicitar permissão ou obter o token.", error);
    
    // Tratamento específico para diferentes tipos de erro
    if (error.message.includes('service worker') || error.message.includes('Service worker')) {
      console.log('Problema com service worker - notificações push não estarão disponíveis, mas o app funciona normalmente');
    } else if (error.message.includes('Timeout')) {
      console.log('Timeout ao configurar notificações - tentativa cancelada');
    } else if (error.code === 'messaging/failed-service-worker-registration') {
      console.log('Falha no registro do service worker - notificações em background não funcionarão');
    }
    
    // Não quebrar a aplicação por causa de notificações
    return null;
  }
};