// public/firebase-messaging-sw.js

// Importa os scripts necessários do Firebase.
// O Firebase vai preencher essas variáveis com seus dados quando for inicializado.
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

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

// Inicializa o Firebase no Service Worker
firebase.initializeApp(firebaseConfig);

// Pega a instância do Messaging para poder receber notificações em segundo plano
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Recebida mensagem em segundo plano ",
    payload
  );

  // Personalize a notificação aqui.
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Caminho para o ícone do seu app na pasta public
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
