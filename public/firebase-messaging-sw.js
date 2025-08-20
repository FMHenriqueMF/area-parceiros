// public/firebase-messaging-sw.js

// Importa os scripts necessários do Firebase (versão atualizada).
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

// As configurações do seu projeto Firebase.
// ATENÇÃO: Cole aqui os mesmos valores que estão no seu arquivo .env
// Este arquivo não consegue ler variáveis de ambiente, então os valores precisam ser diretos.
const firebaseConfig = {
  apiKey: "AIzaSyC95d-wSELjz6dH9ZEdxy0t-Etk-kf0WHo",
  authDomain: "extremaflutter.firebaseapp.com",
  projectId: "extremaflutter",
  storageBucket: "extremaflutter.firebasestorage.app",
  messagingSenderId: "536669714088",
  appId: "1:536669714088:web:f1ba68f60b9a149d1ff49d",
  measurementId: "G-94BDGNWF8Y" 
};

// Inicializa o Firebase no Service Worker com tratamento de erro
try {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase inicializado no Service Worker');
} catch (error) {
  console.error('Erro ao inicializar Firebase no Service Worker:', error);
}

// Pega a instância do Messaging para poder receber notificações em segundo plano
try {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('Mensagem recebida em background:', payload);

    // Personalize a notificação aqui.
    const notificationTitle = payload.notification?.title || 'Nova notificação';
    const notificationOptions = {
      body: payload.notification?.body || 'Você tem uma nova mensagem',
      icon: '/assets/PremierC-jaDZon99.png', // Usa o ícone correto
      badge: '/assets/PremierC-jaDZon99.png',
      tag: 'extrema-notification',
      requireInteraction: true,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error('Erro ao configurar messaging no Service Worker:', error);
}
