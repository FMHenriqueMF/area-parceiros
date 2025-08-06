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
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { logUserActivity } from '../utils/logger.js';
import LoadingSpinner from '../components/LoadingSpinner';

// --- Ícones para a UI ---
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const IconCalendar = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
const IconKey = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" /></svg>;

// --- Componente Principal ---
export default function PainelGanhos() {
  const { currentUser } = useAuth();
  const parceiroUID = currentUser?.uid;
  const [parceiroInfo, setParceiroInfo] = useState(null);
  const [atendimentos, setAtendimentos] = useState([]);


  // --- Estados de UI ---
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [view, setView] = useState("dashboard");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);

  // --- Estados de Filtros e Formulários ---
  const [historyPeriod, setHistoryPeriod] = useState({ inicio: "", fim: "" });
  const [pixUpdateStep, setPixUpdateStep] = useState('confirm_password');
  const [novaChavePix, setNovaChavePix] = useState("");
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [processing, setProcessing] = useState(false);
  const hasLoggedView = useRef(false);

  // --- Efeitos ---
  //useEffect(() => {
  //  const handleResize = () => setIsMobile(window.innerWidth <= 600);
  //  window.addEventListener('resize', handleResize);
  //  return () => window.removeEventListener('resize', handleResize);
  //}, []);

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
      const dataLiberacao = new Date(dataAtendimento.getTime() + 48 * 60 * 60 * 1000);

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
    setPixUpdateStep('confirm_password');
    setSenhaConfirmacao('');
    setNovaChavePix('');
    setFeedback({ type: "", message: "" });
    setShowPixModal(true);
  };

  const handleReauthenticate = async (e) => {
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

   const handleUpdateChavePix = async (e) => {
    e.preventDefault();
    if (!novaChavePix) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "usuarios", parceiroUID), { chave_pix: novaChavePix, chave_pix_ultima_alteracao: Timestamp.now() });
      setParceiroInfo(prev => ({ ...prev, chave_pix: novaChavePix }));
      setShowPixModal(false);
    } catch (error) { setFeedback({ type: "error", message: "Erro ao salvar a nova chave." }); }
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
      setFeedback({ type: "success", message: `Solicitação de ${valorFormatado} enviada com sucesso!` });
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
    <div className="fixed inset-0 bg-black bg-opacity-40 z-[1000] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setShowPixModal(false)}>
      <div className="bg-white rounded-2xl p-5 md:p-8 w-11/12 max-w-lg shadow-2xl relative animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="absolute top-3 right-3 bg-gray-100 rounded-full w-8 h-8 text-sm font-bold flex items-center justify-center hover:bg-gray-200" onClick={() => setShowPixModal(false)}>X</button>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-5">Alterar Chave PIX</h2>
        {pixUpdateStep === 'confirm_password' ? (
          <form onSubmit={handleReauthenticate}>
            <p className="text-center text-gray-600 mb-4">Para sua segurança, digite sua senha de acesso para continuar.</p>
            <div className="relative flex items-center mb-4"><IconLock className="absolute left-3" /><input type="password" placeholder="Sua senha" className="w-full pl-10 p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={senhaConfirmacao} onChange={e => setSenhaConfirmacao(e.target.value)} autoFocus /></div>
            <button type="submit" disabled={processing} className="w-full bg-blue-600 text-white p-4 font-bold rounded-xl transition duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {processing ? 'Verificando...' : 'Confirmar Senha'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdateChavePix}>
            <p className="text-center text-gray-600 mb-4">Ótimo! Agora digite sua nova chave PIX.</p>
            <div className="relative flex items-center mb-4"><IconKey className="absolute left-3" /><input type="text" placeholder="Nova Chave PIX" className="w-full pl-10 p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={novaChavePix} onChange={e => setNovaChavePix(e.target.value)} autoFocus /></div>
            <button type="submit" disabled={processing} className="w-full bg-blue-600 text-white p-4 font-bold rounded-xl transition duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {processing ? 'Salvando...' : 'Salvar Nova Chave'}
            </button>
          </form>
        )}
        {feedback.message && <div className={`p-3 rounded-lg text-sm font-semibold mt-4 text-center ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>}
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

      <button onClick={handleSolicitarPagamento} disabled={processing || totalDisponivel <= 0 || !parceiroInfo.chave_pix} className={`w-full p-4 font-bold rounded-xl transition duration-300 shadow-lg ${processing || totalDisponivel <= 0 || !parceiroInfo.chave_pix ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-blue-600'}`}>
        {processing ? 'Processando...' : 'Confirmar e Enviar Solicitação'}
      </button>
      {!parceiroInfo.chave_pix && <p className="text-red-500 text-center text-sm mt-3 font-semibold">Você precisa cadastrar uma chave PIX para solicitar.</p>}
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
      <div className="text-center mt-8 text-xs text-gray-400 tracking-wide">Premier Clean &copy; {new Date().getFullYear()}</div>
    </div>
  );
}

// --- Folha de Estilos Unificada ---
const getStyles = (isMobile) => ({
  container: { padding: isMobile ? "16px" : "32px 16px", fontFamily: "Inter, Arial, sans-serif", maxWidth: 1000, margin: "auto", background: "linear-gradient(110deg,#f8fafc 60%, #e6eaff 100%)", minHeight: "100vh" },
  header: { fontSize: isMobile ? 24 : 32, color: "#21305b", marginBottom: 20, fontWeight: 900, textAlign: isMobile ? 'center' : 'left' },
  centered: { padding: 50, textAlign: "center", color: "#888", fontSize: 18 },
  cardsContainer: { display: "flex", gap: 16, marginBottom: 24, flexDirection: isMobile ? "column" : "row" },
  card: (grad) => ({ background: grad, borderRadius: 18, boxShadow: "0 4px 24px #dde3ec", padding: 20, flex: 1, color: "#fff", display: 'flex', alignItems: 'center', gap: 16 }),
  cardText: { display: 'flex', flexDirection: 'column' },
  cardLabel: { fontSize: 16, opacity: 0.9 },
  cardValue: { fontSize: 28, fontWeight: 900, marginTop: 8 },
  ctaButton: { background: "#007bff", color: "#fff", border: "none", padding: "16px", fontSize: 16, fontWeight: "bold", borderRadius: 12, cursor: "pointer", width: "100%", transition: "all 0.3s", boxShadow: "0 4px 12px rgba(0, 123, 255, 0.4)", marginTop: 20 },
  ctaButtonDisabled: { background: "#a0c7e4", color: "#e9f2fa", border: "none", padding: "16px", fontSize: 16, fontWeight: "bold", borderRadius: 12, cursor: "not-allowed", width: "100%", marginTop: 20 },
  secondaryButton: { background: 'transparent', color: '#007bff', border: '1px solid #007bff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', width: '100%', marginTop: 10, fontWeight: 600 },
  tableSection: { background: "#fff", borderRadius: 16, boxShadow: "0 0 32px #e6eaff", padding: isMobile ? 16 : 24, marginTop: 24 },
  tableTitle: { fontWeight: "bold", color: "#274472", marginBottom: 16, fontSize: isMobile ? 18 : 20, textAlign: isMobile ? 'center' : 'left' },
  tableContainer: { overflowX: "auto", maxHeight: '40vh' },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 16 },
  thead_tr: { borderBottom: '2px solid #e0e6f1' },
  th: { textAlign: "left", padding: 12, color: '#556a9b', fontWeight: 600, fontSize: 14 },
  tbody_tr: (idx) => ({ background: idx % 2 === 0 ? "#fdfdff" : "#fff" }),
  td: { padding: 12, color: '#334' },
  td_valor: { padding: 12, color: "#177a1a", fontWeight: "bold", fontSize: 18 },
  td_valor_small: { padding: 12, color: "#177a1a", fontWeight: "600" },
  emptyTable: { textAlign: "center", padding: 28, color: "#888" },
  backButton: { background: 'transparent', border: 'none', color: '#007bff', fontSize: 16, cursor: 'pointer', marginBottom: 15, fontWeight: 600 },
  totalValue: { fontSize: 36, fontWeight: 'bold', color: '#007bff', margin: '10px 0', textAlign: 'center' },
  pixSection: { background: '#fff', borderRadius: 16, padding: 20, marginTop: 24, textAlign: 'center', boxShadow: "0 0 32px #e6eaff" },
  pixTitle: { color: '#274472', fontWeight: 600, margin: '0 0 10px 0' },
  pixDisplay: { fontSize: 18, fontWeight: 500, background: '#f0f4f8', padding: 12, borderRadius: 8, wordBreak: 'break-all', color: '#333' },
  pixButton: { background: '#e9ecef', border: '1px solid #ccc', color: '#333', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', marginTop: 10, fontWeight: 600 },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(30, 40, 90, 0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: 'blur(5px)' },
  modalContent: { background: "#fff", borderRadius: 20, padding: isMobile ? 20 : 30, width: '90%', maxWidth: 500, boxShadow: "0 4px 40px #0004", position: "relative", animation: "fadein 0.3s" },
  modalCloseButton: { position: "absolute", top: 10, right: 10, background: "#f1f1f1", border: "none", borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 'bold' },
  modalTitle: { textAlign: 'center', color: '#21305b', marginBottom: 20, fontSize: 22 },
  modalText: { textAlign: 'center', color: '#555', marginBottom: 15 },
  inputGroup: { position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 10, svg: { position: 'absolute', left: 12, color: '#888' } },
  input: { width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', fontSize: 16, border: '1px solid #ccc', borderRadius: 8 },
  feedback: { padding: 12, borderRadius: 8, textAlign: 'center', fontWeight: 600 },
  errorText: { color: '#dc3545', textAlign: 'center', marginTop: 10, fontWeight: 500 },
  badgeSuccess: { backgroundColor: 'rgba(40, 167, 69, 0.1)', color: '#155724', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  badgeWarning: { backgroundColor: 'rgba(255, 193, 7, 0.1)', color: '#856404', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  badgeInfo: { backgroundColor: 'rgba(0, 123, 255, 0.1)', color: '#004085', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  // ADICIONADO: Novo estilo para a tag de erro/retido
  badgeError: { backgroundColor: 'rgba(220, 53, 69, 0.1)', color: '#721c24', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  filterContainer: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20, padding: 10, background: '#f8f9fa', borderRadius: 8 },
  dateInput: { border: '1px solid #ccc', borderRadius: 6, padding: 8, fontSize: 14 },
  clearButton: { background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: 'pointer' },
  footer: { fontSize: 12, color: "#aaa", marginTop: 40, textAlign: "center", letterSpacing: 1 },
});
