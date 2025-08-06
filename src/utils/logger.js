// src/utils/logger.js

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Registra uma atividade do usuário em sua subcoleção de auditoria.
 * @param {string} userId - O ID do usuário que realizou a ação.
 * @param {string} acao - Uma string que descreve a ação (ex: 'LOGIN_SUCCESS').
 * @param {object} detalhes - Um objeto com dados contextuais extras.
 */
const logUserActivity = async (userId, acao, detalhes = {}) => {
  if (!userId) {
    console.error("Tentativa de log sem userId.");
    return;
  }

  try {
    const auditCollectionRef = collection(db, 'usuarios', userId, 'auditoria');
    await addDoc(auditCollectionRef, {
      timestamp: serverTimestamp(),
      acao: acao,
      detalhes: detalhes,
    });
  } catch (error) {
    console.error("Erro ao registrar log de atividade:", error);
  }
};

export { logUserActivity };