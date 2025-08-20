// src/pages/PainelGanhos.jsx

import React, { useEffect, useState, useMemo, useRef } from "react";
import { db, auth } from "../firebase";
import { useAuth } from '../context/AuthContext';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  addDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { logUserActivity } from '../utils/logger.js';
import { validateAndFormatRandomPixKey, isRandomPixKey } from '../utils/pixValidator';
import { useNotification } from '../context/NotificationContext.jsx';


 const s = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      width: '90%',
      maxWidth: '450px',
      position: 'relative',
    },
    modalCloseButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      border: 'none',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
    },
    modalTitle: {
      textAlign: 'center',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '1.5rem',
    },
    modalText: {
      textAlign: 'center',
      color: '#555',
      marginBottom: '1.5rem',
      lineHeight: '1.6',
    },
    inputGroup: {
      position: 'relative',
      marginBottom: '1rem',
    },
    input: {
      width: '100%',
      padding: '12px 12px 12px 40px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '1rem',
    },
    ctaButton: {
      width: '100%',
      padding: '14px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: '#007bff',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    feedback: {
      padding: '10px',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '0.9rem',
    }
  };



// --- Ícones para a UI ---
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const IconCalendar = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
const IconKey = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" /></svg>;

// --- Componente Principal ---
export default function PainelGanhos() {
  const { currentUser } = useAuth();
  const { success, error, warning, info } = useNotification();
  const parceiroUID = currentUser?.uid;
  const [parceiroInfo, setParceiroInfo] = useState(null);
  const [atendimentos, setAtendimentos] = useState([]);

  // --- Estados de UI ---
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [view, setView] = useState("dashboard");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [authProvider, setAuthProvider] = useState(''); // <--- ADICIONE ESTA LINHA


  // --- Estados de Filtros e Formulários ---
  const [historyPeriod, setHistoryPeriod] = useState({ inicio: "", fim: "" });
  const [pixUpdateStep, setPixUpdateStep] = useState('confirm_password');
  const [novaChavePix, setNovaChavePix] = useState("");
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [processing, setProcessing] = useState(false);
  const hasLoggedView = useRef(false);

  useEffect(() => {
    if (!parceiroUID) { setLoading(false); return; }
    if (!hasLoggedView.current) {
        logUserActivity(currentUser.uid, 'Acessou Saldos');
        hasLoggedView.current = true;
      }
    async function fetchData() {
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db, "usuarios", parceiroUID));
        if (userSnap.exists()) setParceiroInfo({ id: userSnap.id, ...userSnap.data() });

        const atendimentosQuery = query(collection(db, "clientes"), where("aceito_por_uid", "==", parceiroUID), where("status", "in", ["finalizado", "travado_por_retorno"]));
        const atendimentosSnap = await getDocs(atendimentosQuery);
        setAtendimentos(atendimentosSnap.docs.map(d => ({ id: d.id, ...d.data(), valorParceiro: Number(d.data().parceiropercentual || 0) })));
      } catch (error) { setFeedback({ type: "error", message: "Não foi possível carregar seus dados." }); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [parceiroUID]);

  // --- Cálculos Memorizados ---
const { disponiveis, totalDisponivel } = useMemo(() => {
    const agora = new Date();
    const disponiveis = atendimentos.filter(a => {
      if (a.status !== "finalizado") return false;
      const statusSaqueOk = (a.status_saque_parceiro === "pendente" || !a.status_saque_parceiro);
      if (!statusSaqueOk) return false;
      if (a.temRetorno === "sim") return false;

      const [d, m, y] = a.data.split('/');
      const dataAtendimento = new Date(y, m - 1, d);
      const dataLiberacao = new Date(dataAtendimento.getTime() + 72 * 60 * 60 * 1000); // 72 horas em milissegundos

      return agora >= dataLiberacao;
    });

    const totalDisponivel = disponiveis.reduce((acc, curr) => acc + curr.valorParceiro, 0);
    return { disponiveis, totalDisponivel };
  }, [atendimentos]);

  const totalMesAtual = useMemo(() => {
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    return atendimentos
      .filter(a => {
        const [d, m, y] = a.data.split('/');
        const dataAtendimento = new Date(y, m - 1, d);
        return dataAtendimento.getMonth() === mes && dataAtendimento.getFullYear() === ano;
      })
      .reduce((acc, curr) => acc + curr.valorParceiro, 0);
  }, [atendimentos]);

  const filteredHistory = useMemo(() => {
    if (!historyPeriod.inicio && !historyPeriod.fim) return atendimentos;
    return atendimentos.filter(a => {
      const [d, m, y] = a.data.split('/');
      const dataAtendimento = new Date(y, m - 1, d);
      const inicio = historyPeriod.inicio ? new Date(historyPeriod.inicio + 'T00:00:00') : null;
      const fim = historyPeriod.fim ? new Date(historyPeriod.fim + 'T23:59:59') : null;
      if (inicio && dataAtendimento < inicio) return false;
      if (fim && dataAtendimento > fim) return false;
      return true;
    });
  }, [atendimentos, historyPeriod]);

  // --- Funções de Ação ---
  const handlePixModalOpen = () => {
    const user = auth.currentUser;
    if (user && user.providerData.length > 0) {
      setAuthProvider(user.providerData[0].providerId);
    }
    setPixUpdateStep('confirm_password');
    setSenhaConfirmacao('');
    setNovaChavePix('');
    setFeedback({ type: "", message: "" });
    setShowPixModal(true);
  };

  const handlePasswordReauthenticate = async (e) => {
    e.preventDefault();
    if (!senhaConfirmacao) return;
    setProcessing(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, senhaConfirmacao);
      await reauthenticateWithCredential(user, credential);
      setPixUpdateStep('enter_new_key');
      setFeedback({ type: "success", message: "Senha confirmada! Agora digite sua nova chave." });
    } catch (error) { setFeedback({ type: "error", message: "Senha incorreta. Tente novamente." }); }
    finally { setProcessing(false); setSenhaConfirmacao(''); }
  };

  // ALTERAÇÃO: Nova função para lidar com a reautenticação de usuários do Google.
  const handleGoogleReauthenticate = async () => {
    setProcessing(true);
    try {
      const user = auth.currentUser;
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      setPixUpdateStep('enter_new_key');
      setFeedback({ type: "success", message: "Identidade confirmada! Agora digite sua nova chave." });
    } catch (error) {
      console.error("Erro na reautenticação com Google:", error);
      let errorMessage = "Não foi possível confirmar sua identidade. Tente novamente.";
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        errorMessage = "A janela de confirmação foi fechada. Tente novamente.";
      }
      setFeedback({ type: "error", message: errorMessage });
    } finally {
      setProcessing(false);
    }
  };

   const handleUpdateChavePix = async (e) => {
    e.preventDefault();
    if (!novaChavePix) return;
    
    // Validar se é uma chave PIX aleatória
    const validation = validateAndFormatRandomPixKey(novaChavePix);
    if (!validation.isValid) {
      setFeedback({ type: "error", message: validation.message });
      return;
    }
    
    setProcessing(true);
    try {
      await updateDoc(doc(db, "usuarios", parceiroUID), { 
        chave_pix: validation.formattedKey, 
        chave_pix_ultima_alteracao: Timestamp.now() 
      });
      setParceiroInfo(prev => ({ ...prev, chave_pix: validation.formattedKey }));
      setShowPixModal(false);
      success('Chave PIX atualizada com sucesso!');
    } catch (error) { 
      error('Erro ao salvar a nova chave. Tente novamente.', 'Erro ao salvar');
    }
    finally { setProcessing(false); }
  };

  const handleSolicitarPagamento = async () => {
    if (totalDisponivel <= 0 || processing) return;
    setProcessing(true);
    const idsAtendimentos = disponiveis.map(a => a.id);
    try {
      await addDoc(collection(db, "solicitacoes_pagamento"), {
        parceiro_uid: parceiroUID, parceiro_nome: parceiroInfo.nome_empresa, chave_pix_utilizada: parceiroInfo.chave_pix,
        valor_solicitado: totalDisponivel, data_solicitacao: Timestamp.now(), status: "solicitado",
        atendimentos_ids: idsAtendimentos, quantidade_atendimentos: idsAtendimentos.length,
        atendimentos_detalhes: disponiveis.map(a => ({ id: a.id, cliente_ultimos4: a.ultimos4 || 'N/A', servico: a.itens_cliente, data_servico: a.data, valor: a.valorParceiro })),
      });

            const batch = writeBatch(db);
      idsAtendimentos.forEach(id => batch.update(doc(db, "clientes", id), { status_saque_parceiro: "solicitado" }));
      await batch.commit();

      const webhookUrl = "https://hook.us2.make.com/s8apqhhtbod5eaffa8acw9kmmvd3w5ts";
      const valorFormatado = totalDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const mensagem = `Olá! ${parceiroInfo.nome_empresa}! -  *Sucesso! Sua solicitação de saque no valor de ${valorFormatado} foi realizada.*✅ _O valor será creditado na sua chave Pix em até 24 horas úteis. Lembre-se de manter sua chave sempre atualizada._`;

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: mensagem,
          telefone: parceiroInfo.telefone,
        })
      }).catch(err => console.error("Erro ao enviar para o webhook:", err));

      const requestedIds = new Set(idsAtendimentos);
      setAtendimentos(prevAtendimentos =>
        prevAtendimentos.map(atendimento =>
          requestedIds.has(atendimento.id)
            ? { ...atendimento, status_saque_parceiro: 'solicitado' }
            : atendimento
        )
      );
      success(`Solicitação de ${valorFormatado} enviada com sucesso! Você receberá o pagamento na sua chave PIX em até 24 horas úteis.`, 'Solicitação Enviada!');
      setView("dashboard");

   } catch (error) {
      console.error("Erro ao solicitar pagamento:", error);
      setFeedback({ type: "error", message: "Erro ao solicitar pagamento. Tente novamente." });
    }
    finally { setProcessing(false); }
  };

  // --- Sub-Renderizadores ---
  const renderStatusBadge = (atendimento) => {
    if (atendimento.temRetorno === "sim" || atendimento.status === "travado_por_retorno") {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Retido (Garantia)</span>;
    }

    const status = atendimento.status_saque_parceiro;
    const statusMap = {
      pago: { text: 'Pago', className: 'bg-green-100 text-green-800' },
      solicitado: { text: 'Solicitado', className: 'bg-yellow-100 text-yellow-800' },
    };
    const defaultStatus = { text: 'Disponível', className: 'bg-blue-100 text-blue-800' };
    const { text, className } = statusMap[status] || defaultStatus;
    return <span className={`${className} px-2 py-1 rounded-full text-xs font-bold`}>{text}</span>;
  }

  const renderPixUpdateModal = () => (
    <div style={s.modalOverlay} onClick={() => setShowPixModal(false)}>
      <div style={s.modalContent} onClick={e => e.stopPropagation()}>
        <button style={s.modalCloseButton} onClick={() => setShowPixModal(false)}>X</button>
        <h2 style={s.modalTitle}>Alterar Chave PIX</h2>
        
        {pixUpdateStep === 'confirm_password' ? (
          <>
            {authProvider === 'password' && (
              <form onSubmit={handlePasswordReauthenticate}>
                <p style={s.modalText}>Para sua segurança, digite sua senha de acesso para continuar.</p>
                <div style={s.inputGroup}><IconLock /><input type="password" placeholder="Sua senha" style={s.input} value={senhaConfirmacao} onChange={e => setSenhaConfirmacao(e.target.value)} autoFocus/></div>
                <button type="submit" disabled={processing} style={s.ctaButton}>{processing ? 'Verificando...' : 'Confirmar Senha'}</button>
              </form>
            )}
            
            {authProvider === 'google.com' && (
              <div style={{textAlign: 'center'}}>
                <p style={s.modalText}>Para sua segurança, confirme sua identidade através do Google.</p>
                <button onClick={handleGoogleReauthenticate} disabled={processing} style={{...s.ctaButton, background: '#4285F4'}}>
                  {processing ? 'Aguardando...' : 'Confirmar com Google'}
                </button>
              </div>
            )}
            
            {authProvider && !['password', 'google.com'].includes(authProvider) && (
              <p style={s.modalText}>
                Não é possível alterar a chave PIX automaticamente para este tipo de conta. Por favor, entre em contato com o suporte.
              </p>
            )}
          </>
        ) : (
          <form onSubmit={handleUpdateChavePix}>
            <p style={s.modalText}>Ótimo! Agora digite sua chave PIX.</p>
            
            {/* Explicação amigável sobre chave PIX */}
            <div style={{backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e9ecef'}}>
              <h4 style={{margin: '0 0 8px 0', color: '#495057', fontSize: '14px', fontWeight: 'bold'}}>
                ℹ️ Que tipo de chave PIX usar?
              </h4>
              <p style={{margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d', lineHeight: '1.4'}}>
                Por segurança, aceitamos apenas a <strong>"Chave Aleatória"</strong> do PIX.
              </p>
              <p style={{margin: '0', fontSize: '12px', color: '#28a745', lineHeight: '1.3'}}>
                <strong>✅ Exemplo válido:</strong> a1b2c3d4-5678-9abc-def0-123456789012
              </p>
              <details style={{marginTop: '8px'}}>
                <summary style={{fontSize: '12px', color: '#007bff', cursor: 'pointer'}}>
                  Como encontrar minha chave aleatória? 👆 Clique aqui
                </summary>
                <div style={{marginTop: '8px', fontSize: '11px', color: '#6c757d', lineHeight: '1.4'}}>
                  <p><strong>No app do seu banco:</strong></p>
                  <p>1. Vá em PIX → Minhas Chaves</p>
                  <p>2. Procure a chave que tem números e letras com traços</p>
                  <p>3. Copie e cole aqui</p>
                  <p style={{color: '#dc3545', marginTop: '4px'}}>⚠️ Não aceitamos CPF, email ou telefone</p>
                </div>
              </details>
            </div>
            
            <div style={s.inputGroup}>
              <IconKey />
              <input 
                type="text" 
                placeholder="Cole sua chave PIX aleatória aqui" 
                style={s.input} 
                value={novaChavePix} 
                onChange={e => setNovaChavePix(e.target.value)} 
                autoFocus
              />
            </div>
            <button type="submit" disabled={processing} style={s.ctaButton}>{processing ? 'Salvando...' : 'Salvar Nova Chave'}</button>
          </form>
        )}

        {feedback.message && <div style={{...s.feedback, backgroundColor: feedback.type === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)', color: feedback.type === 'success' ? '#155724' : '#721c24', marginTop: 15}}>{feedback.message}</div>}
      </div>
    </div>
  );

   const renderHistoryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-[1000] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setShowHistoryModal(false)}>
      <div className="bg-white rounded-2xl p-5 md:p-8 w-11/12 max-w-4xl shadow-2xl relative animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="absolute top-3 right-3 bg-gray-100 rounded-full w-8 h-8 text-sm font-bold flex items-center justify-center hover:bg-gray-200" onClick={() => setShowHistoryModal(false)}>X</button>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-5">Histórico Completo de Atendimentos</h2>

        <div className="flex flex-wrap items-center justify-center gap-3 bg-gray-100 p-3 rounded-lg mb-4">
          <input type="date" className="p-2 text-sm border border-gray-300 rounded-md" value={historyPeriod.inicio} onChange={e => setHistoryPeriod(p => ({ ...p, inicio: e.target.value }))} />
          <span className="text-gray-500">até</span>
          <input type="date" className="p-2 text-sm border border-gray-300 rounded-md" value={historyPeriod.fim} onChange={e => setHistoryPeriod(p => ({ ...p, fim: e.target.value }))} />
          <button className="bg-gray-500 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-600" onClick={() => setHistoryPeriod({ inicio: '', fim: '' })}>Limpar</button>
        </div>
          <p className="text-center text-xs text-blue-600 font-medium mb-4">Os Pagamentos Podem ser Solicitados Após 48h da Conclusão do Serviço.</p>


        <div className="overflow-x-auto max-h-[40vh]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">Data</th>
                <th scope="col" className="px-6 py-3">Cliente (OS)</th>
                <th scope="col" className="px-6 py-3">Valor</th>
                <th scope="col" className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr className="bg-white border-b"><td colSpan="4" className="text-center px-6 py-4 text-gray-500">Nenhum atendimento no período.</td></tr>
              ) : (
                filteredHistory.map((a, idx) => (
                  <tr key={a.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{a.data}</td>
                    <td className="px-6 py-4">{a.ultimos4 || "--"}</td>
                    <td className="px-6 py-4 text-green-700 font-bold">{a.valorParceiro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td className="px-6 py-4">{renderStatusBadge(a)}</td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

    const renderDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl shadow-xl p-6 flex items-center gap-4 text-white">
          <IconWallet />
          <div>
            <div className="text-sm opacity-90">Disponível para Saque</div>
            <div className="text-3xl font-bold mt-1">{totalDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-gray-900 to-green-900 rounded-3xl shadow-xl p-6 flex items-center gap-4 text-white">
          <IconCalendar />
          <div>
            <div className="text-sm opacity-90">Ganhos no Mês</div>
            <div className="text-3xl font-bold mt-1">{totalMesAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          </div>
        </div>
      </div>

      <button className={`w-full p-4 font-bold rounded-xl transition duration-300 shadow-lg mt-4 ${totalDisponivel > 0 ? 'bg-brand-blue text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`} onClick={() => setView('solicitar')} disabled={totalDisponivel <= 0}>Solicitar Pagamento</button>
      <button className="w-full text-brand-blue border border-brand-blue p-2 font-semibold rounded-lg mt-2 transition duration-300 hover:bg-brand-blue hover:text-white" onClick={() => setShowHistoryModal(true)}>Ver histórico completo</button>

      {feedback.message && <div className={`p-3 rounded-lg text-sm font-semibold mt-4 text-center ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>}

      <div className="bg-white rounded-3xl shadow-2xl p-5 md:p-8 mt-6">
        <h2 className="font-bold text-xl text-gray-800 mb-4 text-center md:text-left">Atendimentos Disponíveis para Saque</h2>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr><th scope="col" className="px-6 py-3">Data</th><th scope="col" className="px-6 py-3">Cliente (OS)</th><th scope="col" className="px-6 py-3">Valor</th></tr>
            </thead>
            <tbody>
              {disponiveis.length === 0 ? (
                <tr className="bg-white border-b"><td colSpan="3" className="text-center px-6 py-4 text-gray-500">Nenhum atendimento liberado para saque.</td></tr>
              ) : (
                disponiveis.map((a, idx) => (
                  <tr key={a.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{a.data}</td>
                    <td className="px-6 py-4">{a.ultimos4 || "--"}</td>
                    <td className="px-6 py-4 text-green-700 font-bold">{a.valorParceiro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

   const renderSolicitacao = () => (
    <>
      {showPixModal && renderPixUpdateModal()}
      <button className="flex items-center text-blue-600 font-semibold mb-4" onClick={() => setView('dashboard')}>&larr; Voltar ao Painel</button>
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Confirmar Solicitação</h1>

      <div className="bg-blue-50 bg-opacity-70 rounded-3xl shadow-lg p-6 mb-6">
        <p className="text-center text-lg text-gray-700">Valor total a ser solicitado:</p>
        <p className="text-5xl font-bold text-blue-600 text-center my-4">{totalDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        <p className="text-center text-sm text-gray-500 -mt-3">Referente a {disponiveis.length} atendimentos.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-6 text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Chave PIX para Pagamento</h3>
        <p className="text-lg font-medium bg-gray-100 p-3 rounded-lg break-all text-gray-700">{parceiroInfo.chave_pix || "Nenhuma chave cadastrada"}</p>
        <button onClick={handlePixModalOpen} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg mt-3 transition duration-300 hover:bg-gray-300">Alterar</button>
      </div>

      <button onClick={handleSolicitarPagamento} disabled={processing || totalDisponivel <= 0 || !parceiroInfo.chave_pix || !isRandomPixKey(parceiroInfo.chave_pix)} className={`w-full p-4 font-bold rounded-xl transition duration-300 shadow-lg ${processing || totalDisponivel <= 0 || !parceiroInfo.chave_pix || !isRandomPixKey(parceiroInfo.chave_pix) ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-blue-600'}`}>
        {processing ? 'Processando...' : 'Confirmar e Enviar Solicitação'}
      </button>
      {!parceiroInfo.chave_pix && <p className="text-red-500 text-center text-sm mt-3 font-semibold">Você precisa cadastrar uma chave PIX para solicitar.</p>}
      {parceiroInfo.chave_pix && !isRandomPixKey(parceiroInfo.chave_pix) && <p className="text-red-500 text-center text-sm mt-3 font-semibold">Por segurança, aceitamos apenas chaves PIX aleatórias. Clique em "Alterar" para cadastrar uma chave válida.</p>}
      {feedback.message && <div className={`p-3 rounded-lg text-sm font-semibold mt-4 text-center ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>}

    </>
  );

  // --- Renderização Principal ---
  if (loading) return <div className="text-center p-10 text-gray-600">Carregando...</div>;
  if (!parceiroInfo) return <div className="text-center p-10 text-gray-600">Dados do parceiro não encontrados.</div>;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-100 text-gray-800 font-sans max-w-7xl mx-auto">
      {showHistoryModal && renderHistoryModal()}
      <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center md:text-left">{parceiroInfo.nome_empresa}</h1>
      {view === 'dashboard' ? renderDashboard() : renderSolicitacao()}
      <div className="text-center mt-8 text-xs text-gray-400 tracking-wide">Extrema Limpeza &copy; {new Date().getFullYear()}</div>
    </div>
  );
}