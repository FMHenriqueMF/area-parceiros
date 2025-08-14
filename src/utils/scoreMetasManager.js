// src/utils/scoreMetasManager.js

import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export const atualizarPontuacaoSemanalDoUsuario = async (userId) => {
  if (!userId) {
    console.error("ID de usuário não fornecido.");
    return;
  }

  try {
    const hoje = new Date();
    
    // --- Lógica para a SEMANA ATUAL (começa no domingo) ---
    const inicioSemanaAtual = new Date(hoje);
    inicioSemanaAtual.setDate(hoje.getDate() - hoje.getDay());
    inicioSemanaAtual.setHours(0, 0, 0, 0);

    const fimSemanaAtual = new Date(inicioSemanaAtual);
    fimSemanaAtual.setDate(inicioSemanaAtual.getDate() + 6);
    fimSemanaAtual.setHours(23, 59, 59, 999);

    // Consulta OTIMIZADA para a semana atual
    const qSemanaAtual = query(
      collection(db, "clientes"),
      where("status", "==", "finalizado"),
      where("aceito_por_uid", "==", userId),
      where("dataTimestamp", ">=", inicioSemanaAtual), // <-- FILTRO DE DATA NO SERVIDOR
      where("dataTimestamp", "<=", fimSemanaAtual)   // <-- FILTRO DE DATA NO SERVIDOR
    );

    const snapshotSemanaAtual = await getDocs(qSemanaAtual);
    let pontuacaoSemanaAtual = 0;
    snapshotSemanaAtual.forEach(doc => { // <-- Loop apenas nos docs da semana
      pontuacaoSemanaAtual += doc.data().ponto || 0;
    });

    // --- Lógica para a SEMANA PASSADA ---
    const inicioSemanaPassada = new Date(inicioSemanaAtual);
    inicioSemanaPassada.setDate(inicioSemanaPassada.getDate() - 7);

    const fimSemanaPassada = new Date(fimSemanaAtual);
    fimSemanaPassada.setDate(fimSemanaPassada.getDate() - 7);
    
    // Consulta OTIMIZADA para a semana passada
    const qSemanaPassada = query(
      collection(db, "clientes"),
      where("status", "==", "finalizado"),
      where("aceito_por_uid", "==", userId),
      where("dataTimestamp", ">=", inicioSemanaPassada), // <-- FILTRO DE DATA NO SERVIDOR
      where("dataTimestamp", "<=", fimSemanaPassada)   // <-- FILTRO DE DATA NO SERVIDOR
    );

    const snapshotSemanaPassada = await getDocs(qSemanaPassada);
    let pontuacaoSemanaPassada = 0;
    snapshotSemanaPassada.forEach(doc => { // <-- Loop apenas nos docs da semana
      pontuacaoSemanaPassada += doc.data().ponto || 0;
    });

    // --- Atualizar o documento do usuário ---
    const userRef = doc(db, "usuarios", userId);
    await updateDoc(userRef, {
      pontuacaoSemanaAtual: pontuacaoSemanaAtual,
      pontuacaoSemanaPassada: pontuacaoSemanaPassada,
      ultimaAtualizacaoPontuacao: hoje
    });

    console.log(`Pontuação do usuário ${userId} atualizada.`);
  } catch (error) {
    console.error("Erro ao atualizar a pontuação semanal:", error);
  }
};