// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // <-- IMPORTAR ANALYTICS

// Sua configuração do app da web do Firebase, lida das variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // <-- NOVA LINHA
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase que vamos usar no resto do app
export const auth = getAuth(app);
export const analytics = getAnalytics(app); // <-- EXPORTAR ANALYTICS
export const db = initializeFirestore(app, {
  // O cache 'persistentLocalCache' gerencia a persistência em IndexedDB
  // para uma única aba ativa, que é o comportamento mais comum e seguro.
  cache: persistentLocalCache({}),
});