// src/pages/ClientDetailPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, getDocs, query, where, orderBy, runTransaction, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StaticMap from '../components/StaticMap.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import ActionConfirmationModal from '../components/ActionConfirmationModal.jsx';
import SimpleAlertModal from '../components/SimpleAlertModal.jsx';
import successAnimation from '../assets/success-animation.json';
import paymentAnimation from '../assets/payment-animation.json';
import { logUserActivity } from '../utils/logger.js';
import { getPartnerPermissions } from '../utils/permissions.js';
import { addReliabilityEvent } from '../utils/scoreManager.js';
import { toast } from 'react-toastify';
import ActionCarousel from '../components/ActionCarousel';
import { FiEdit } from 'react-icons/fi';
import { MdOutlineCalendarToday, MdOutlineLocationOn, MdFormatListBulleted, MdInfoOutline, MdAttachMoney } from 'react-icons/md';
import { getDoc } from 'firebase/firestore';

const CHECKLIST_STEPS = {
  START: 'start',
  CONFIRM_SERVICE: 'confirm_service',
  BEFORE_PHOTOS: 'before_photos',
  AFTER_PHOTOS: 'after_photos',
  ADD_EXTRA_INFO: 'add_extra_info',
  SEND_PAYMENT: 'send_payment',
};

const getTurnoByHora = (hora) => {
  if (!hora) return null;
  const [hour, minute] = hora.split(':').map(Number);
  const fullTime = hour + minute / 60;
  if (fullTime >= 6 && fullTime < 12) return 'Manhã';
  if (fullTime >= 12 && fullTime < 19) return 'Tarde';
  return null;
};

const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/yt7j57js7auf6qqtnkmtkkwllzqai3zu";

function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [extraInfo, setExtraInfo] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelMessage, setCancelMessage] = useState({ title: '', message: '' });
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [canAcceptJob, setCanAcceptJob] = useState({ can: false, reason: 'Verificando permissões...' });
  const [dailyJobCount, setDailyJobCount] = useState({ accepted: 0, limit: 0 });
  const [checklistStep, setChecklistStep] = useState(CHECKLIST_STEPS.START);
  const [showAlert, setShowAlert] = useState({ show: false, title: '', message: '' });
  const [showAltPayment, setShowAltPayment] = useState(false);
  const [altPaymentPhone, setAltPaymentPhone] = useState('');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [carouselStep, setCarouselStep] = useState(1);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [newItems, setNewItems] = useState([]);
  const [newTotalPrice, setNewTotalPrice] = useState(0);

  const isOwner = currentUser && cliente && currentUser.uid === cliente.aceito_por_uid;
  const canViewSensitiveData = isOwner && ['deslocamento', 'cheguei', 'aguardandopagamento', 'finalizado'].includes(cliente?.status);

  const timerRef = useRef(null);
  
  const handleItemsChange = useCallback((items, price) => {
    setNewItems(items);
    setNewTotalPrice(price);
  }, []);

  useEffect(() => {
    if (isOwner && isDetailsExpanded && cliente?.status === 'cheguei') {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsDetailsExpanded(false);
      }, 1500);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDetailsExpanded, cliente, isOwner]);

  useEffect(() => {
    if (!id || !currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const docRef = doc(db, 'clientes', id);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const clientData = { id: docSnap.id, ...docSnap.data() };
        
        if (!clientData.turno && clientData.hora) {
          clientData.turno = getTurnoByHora(clientData.hora);
        }
        
        setCliente(clientData);
        setExtraInfo(clientData.RelatotecnicoItens || '');
        setNewItems(clientData.itens_cliente);
        setNewTotalPrice(clientData.parceiropercentual);

        if (clientData.status === 'finalizado') {
          if (!clientData.nota_atualizada) {
            await addReliabilityEvent(db, currentUser.uid, 10.0);
            const clientRef = doc(db, 'clientes', id);
            await updateDoc(clientRef, { nota_atualizada: true });
          }
          setShowPaymentSuccessModal(true);
          setChecklistStep(null);
        } else if (!showAltPayment && clientData.status !== 'aguardandopagamento') {
          if (clientData.status === 'cheguei') {
            const checklistStepsOrder = ['servico_confirmado', 'fotos_antes', 'fotos_depois', 'RelatotecnicoItens'];
            const currentStepIndex = checklistStepsOrder.findIndex(key => !clientData[key]);
            if (currentStepIndex !== -1) {
              const newStep = [CHECKLIST_STEPS.CONFIRM_SERVICE, CHECKLIST_STEPS.BEFORE_PHOTOS, CHECKLIST_STEPS.AFTER_PHOTOS, CHECKLIST_STEPS.ADD_EXTRA_INFO][currentStepIndex];
              setChecklistStep(newStep);
            } else {
              setChecklistStep(CHECKLIST_STEPS.SEND_PAYMENT);
            }
          } else {
            setChecklistStep(CHECKLIST_STEPS.START);
          }
        } else if (clientData.status === 'aguardandopagamento') {
          setChecklistStep(null);
        }

        // >>>>>>>>>>>>>>>>>> LÓGICA DE PERMISSÃO UNIFICADA <<<<<<<<<<<<<<<<<<<<
        if (clientData.status === 'disponivel') {
          try {
            const permissions = await getPartnerPermissions(currentUser.nota_final_unificada);
            if (!permissions.canAccept) {
              setCanAcceptJob({ can: false, reason: permissions.message });
              setDailyJobCount({ accepted: 0, limit: permissions.dailyLimit });
              setLoading(false);
              return;
            }

            const servicosRef = collection(db, 'clientes');
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const dailyQuery = query(servicosRef,
              where("aceito_por_uid", "==", currentUser.uid),
              where("aceito_em", ">=", startOfToday),
              orderBy("aceito_em")
            );
            const dailySnapshot = await getDocs(dailyQuery);
            const jobsAcceptedToday = dailySnapshot.size;

            if (jobsAcceptedToday >= permissions.dailyLimit) {
              setCanAcceptJob({ can: false, reason: `Você já atingiu seu limite diário de ${permissions.dailyLimit} serviço(s). Aumente sua nota para aumentar seu limite, mais informações na sua página de Perfil.` });
              setDailyJobCount({ accepted: jobsAcceptedToday, limit: permissions.dailyLimit });
            } else {
              const turnQuery = query(servicosRef,
                where("aceito_por_uid", "==", currentUser.uid),
                where("data", "==", clientData.data),
                where("turno", "==", clientData.turno)
              );
              const turnSnapshot = await getDocs(turnQuery);
              const jobsInSameTurn = turnSnapshot.size;

              if (jobsInSameTurn >= permissions.turnLimit) {
                setCanAcceptJob({ can: false, reason: `Você já atingiu seu limite de ${permissions.turnLimit} serviço(s) para o turno da ${clientData.turno} do dia ${clientData.data}. Aumente sua nota para aumentar seu limite, mais informações na sua página de Perfil.` });
              } else {
                setCanAcceptJob({ can: true, reason: '' });
              }
              setDailyJobCount({ accepted: jobsAcceptedToday, limit: permissions.dailyLimit });
            }
          } catch (error) {
            console.error("Erro ao obter permissões do parceiro:", error);
            setCanAcceptJob({ can: false, reason: 'Não foi possível verificar as permissões.' });
            setDailyJobCount({ accepted: 0, limit: 0 });
          }
        } else {
          setCanAcceptJob({ can: false, reason: 'Serviço não está disponível para aceitação.' });
          setDailyJobCount({ accepted: 0, limit: 0 });
        }
      } else {
        setCliente(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao escutar o cliente:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, showAltPayment, currentUser, navigate, db]);

  const handleUpdateStatus = async (newStatus) => {
    if (!currentUser || !cliente) return;
    const clientRef = doc(db, 'clientes', id);
    try {
      await updateDoc(clientRef, { status: newStatus });
      setCliente(prev => ({ ...prev, status: newStatus }));
      if (newStatus === 'cheguei') {
        setChecklistStep(CHECKLIST_STEPS.CONFIRM_SERVICE);
      } else if (newStatus === 'aguardandopagamento') {
        setChecklistStep(null);
      } else if (newStatus === 'finalizado') {
        setChecklistStep(null);
      }
      logUserActivity(currentUser.uid, 'Atualizou o status do cliente', { clienteId: id, newStatus: newStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setShowAlert({ show: true, title: 'Erro!', message: 'Não foi possível atualizar o status.' });
    }
  };
  const handleClaimJob = async () => {
    setActionLoading(true);
    setActionError('');
    if (!canAcceptJob.can) {
      setActionError(canAcceptJob.reason || "Você não tem permissão para aceitar este serviço.");
      setActionLoading(false);
      return;
    }
    try {
      const clientRef = doc(db, "clientes", id);
      await runTransaction(db, async (transaction) => {
        const clientDoc = await transaction.get(clientRef);
        if (!clientDoc.exists() || clientDoc.data().status !== 'disponivel') {
          throw new Error("Ops! Este serviço não está mais disponível.");
        }
        transaction.update(clientRef, {
          status: 'aceito',
          aceito_por: currentUser.nome_empresa,
          aceito_por_uid: currentUser.uid,
          aceito_em: serverTimestamp()
        });
      });
      await logUserActivity(currentUser.uid, 'SERVICO_ACEITO', { clienteId: id, clienteNome: cliente?.quem_recebe });
      setShowConfirmation(true);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };
  const handleStartTrip = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const clientRef = doc(db, "clientes", id);
      await updateDoc(clientRef, { status: 'deslocamento' });
      await logUserActivity(currentUser.uid, 'INICIOU_DESLOCAMENTO', { clienteId: id, clienteNome: cliente?.quem_recebe, OS: cliente?.ultimos4 });
    } catch (error) {
      console.error("Erro ao iniciar deslocamento:", error);
      setActionError("Não foi possível atualizar o status. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };
  const handleArrived = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const clientRef = doc(db, "clientes", id);
      await updateDoc(clientRef, { status: 'cheguei' });
      await logUserActivity(currentUser.uid, 'CHEGOU_AO_LOCAL', { clienteId: id, clienteNome: cliente?.quem_recebe });
    } catch (error) {
      console.error("Erro ao marcar chegada:", error);
      setActionError("Não foi possível atualizar o status. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };
  const sendPaymentLink = async (phone) => {
    if (!phone) {
      setActionError("É necessário um número de telefone para enviar o link.");
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const payload = {
        nome: cliente?.quem_recebe,
        telefone: phone,
        codigo_cliente: `${id}-${cliente?.aceito_por_uid}`,
        id_parceiro: cliente?.aceito_por_uid,
        valor: cliente?.parceiropercentual,
      };

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Make: ${response.statusText}`);
      }


      const clientRef = doc(db, "clientes", id);
      await updateDoc(clientRef, { status: 'aguardandopagamento' });
      await logUserActivity(currentUser.uid, 'ENVIOU_LINK_PAGAMENTO', {
        clienteId: id,
        clienteNome: cliente?.quem_recebe,
        telefonePagamento: phone
      });
      setActionLoading(false);

      toast.success(`Link de pagamento enviado para ${phone} com sucesso! Aguardando confirmação.`, { position: "bottom-center" });

    } catch (error) {
      console.error("Erro no envio do pagamento via webhook:", error);
      setActionError(`Ocorreu um erro ao enviar o link de pagamento. Tente novamente. Erro: ${error.message}`);
      setActionLoading(false);
    }
  };
  const handleInitialPaymentClick = async () => {
    setShowAltPayment(true);

    if (!cliente?.telefone_cliente) {
      setActionError("O cliente não tem um número de telefone cadastrado.");
      return;
    }
    await sendPaymentLink(cliente.telefone_cliente);
  };
  const handleSendPaymentForAltPhone = async () => {
    await sendPaymentLink(altPaymentPhone);
  };
  const handlePhotosUploaded = async (imageUrls, photoType) => {
    if (!imageUrls || imageUrls.length === 0) return;
    try {
      const clientRef = doc(db, "clientes", id);
      const updatePayload = photoType === 'before' ? { fotos_antes: arrayUnion(...imageUrls) } : { fotos_depois: arrayUnion(...imageUrls) };
      await updateDoc(clientRef, updatePayload);
      setCliente(prev => ({
        ...prev,
        [photoType === 'before' ? 'fotos_antes' : 'fotos_depois']: [...(prev[photoType === 'before' ? 'fotos_antes' : 'fotos_depois'] || []), ...imageUrls]
      }));
      if (photoType === 'before') {
        setChecklistStep(CHECKLIST_STEPS.AFTER_PHOTOS);
      } else if (photoType === 'after') {
        setChecklistStep(CHECKLIST_STEPS.ADD_EXTRA_INFO);
      }
      setShowAlert({ show: true, title: 'Sucesso!', message: 'Fotos enviadas com sucesso!' });
      await logUserActivity(currentUser.uid, 'FOTOS_ENVIADAS', { clienteId: id, clienteNome: cliente?.quem_recebe, photoCount: imageUrls.length });
    } catch (error) {
      console.error("Erro ao salvar URLs das fotos:", error);
      setShowAlert({ show: true, title: 'Erro!', message: 'Ocorreu um erro ao salvar as fotos. Tente novamente.' });
    }
  };
  const handleSaveExtraInfo = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const clientRef = doc(db, "clientes", id);
      await updateDoc(clientRef, {
        RelatotecnicoItens: extraInfo
      });
      setChecklistStep(CHECKLIST_STEPS.SEND_PAYMENT);
      setShowAlert({ show: true, title: 'Sucesso!', message: 'Informações salvas com sucesso!' });
      await logUserActivity(currentUser.uid, 'SALVOU_RELATORIO_TECNICO', { clienteId: id, clienteNome: cliente?.quem_recebe });
    } catch (error) {
      console.error("Erro ao salvar informações extras:", error);
      setActionError("Não foi possível salvar as informações. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };
  const handleOpenCancelModal = () => {
    if (!cliente?.data || typeof cliente.data !== 'string' || cliente.data.split('/').length !== 3) {
      setShowAlert({ show: true, title: 'Erro!', message: 'Não é possível cancelar. A data do agendamento não foi encontrada ou está em um formato inválido.' });
      return;
    }
    const dateParts = cliente.data.split('/');
    const timeParts = cliente.hora ? cliente.hora.split(':') : [8, 0];
    const serviceDateTime = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0], timeParts[0], timeParts[1]);
    const now = new Date();
    const hoursDifference = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursDifference <= 5) {
      setCancelMessage({
        title: "Atenção: Cancelamento Próximo ao Horário",
        message: "O cancelamento de serviços com pouca antecedência pode afetar sua prioridade na plataforma para futuros agendamentos. Deseja continuar?",
      });
    } else {
      setCancelMessage({
        title: "Confirmar Cancelamento?",
        message: "Você tem certeza que deseja cancelar este serviço? Ele voltará para a Lista de Clientes e ficará disponível para outros parceiros.",
      });
    }
    setIsCancelModalOpen(true);
  };
  const handleConfirmCancel = async () => {
    setActionLoading(true);
    try {
      const clientRef = doc(db, "clientes", id);
      const clienteAntes = { ...cliente };
      await updateDoc(clientRef, {
        status: 'disponivel',
        aceito_por: ' ',
        aceito_por_uid: ' '
      });
      await logUserActivity(currentUser.uid, 'Cancelou o Serviço', { clienteId: id, clienteNome: clienteAntes?.quem_recebe, OS: clienteAntes?.ultimos4 });
      const parceiroRef = doc(db, "usuarios", currentUser.uid);
      const parceiroSnap = await getDoc(parceiroRef);
      if (parceiroSnap.exists()) {
        const dadosParceiro = parceiroSnap.data();
        const dateParts = clienteAntes.data.split('/');
        const timeParts = clienteAntes.hora ? clienteAntes.hora.split(':') : [8, 0];
        const serviceDateTime = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0], timeParts[0], timeParts[1]);
        const now = new Date();
        const hoursDifference = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        let notaEventoCancelamento;
        if (hoursDifference > 32) notaEventoCancelamento = 3.5;
        else if (hoursDifference > 24) notaEventoCancelamento = 3.0;
        else if (hoursDifference > 5) notaEventoCancelamento = 2.0;
        else notaEventoCancelamento = 1.0;
        await addReliabilityEvent(db, currentUser.uid, notaEventoCancelamento);
        setShowAlert({ show: true, title: 'Cancelado!', message: 'Serviço cancelado e devolvido à Lista de Clientes.' });
        navigate('/meus-servicos');
      }
    } catch (error) {
      console.error("Erro ao cancelar serviço:", error);
      setShowAlert({ show: true, title: 'Erro!', message: 'Não foi possível cancelar o serviço.' });
    } finally {
      setActionLoading(false);
      setIsCancelModalOpen(false);
    }
  };
  const handleConfirmService = async () => {
    if (newTotalPrice < cliente.parceiropercentual) {
      setShowAlert({
        show: true,
        title: 'Erro de Orçamento!',
        message: 'O novo valor do serviço não pode ser menor que o original. Por favor, entre em contato com o suporte para ajustes.',
      });
      setIsEditingItems(false);
      return;
    }

    setActionLoading(true);
    try {
      const clientRef = doc(db, 'clientes', id);
      const updatePayload = {
        servico_confirmado: true,
        itens_cliente: newItems,
        parceiropercentual: newTotalPrice,
      };
      await updateDoc(clientRef, updatePayload);
      setChecklistStep(CHECKLIST_STEPS.BEFORE_PHOTOS);
      logUserActivity(currentUser.uid, 'Confirmou e alterou os itens do serviço', { clienteId: id, oldItems: cliente.itens_cliente, newItems, oldPrice: cliente.parceiropercentual, newPrice: newTotalPrice });
      setIsEditingItems(false);
      toast.success('Itens do serviço e valor atualizados com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar o serviço:", error);
      toast.error('Não foi possível atualizar o serviço. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleFinalizeService = async () => {
    setActionLoading(true);
    try {
      const clientRef = doc(db, 'clientes', id);
      const userRef = doc(db, 'usuarios', currentUser.uid);
      
      const newWeeklyScore = Math.ceil(cliente.valor_totalNUM);
      
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw "Documento do usuário não encontrado!";
        }
        
        const userData = userDoc.data();
        const currentWeeklyScore = userData.pontuacao_semanal || 0;
        
        transaction.update(userRef, {
          pontuacao_semanal: currentWeeklyScore + newWeeklyScore,
        });

        transaction.update(clientRef, {
          status: 'finalizado',
        });
      });
      
      await logUserActivity(currentUser.uid, 'FINALIZOU_ATENDIMENTO_PONTUOU_SEMANAL', { clienteId: id, pontuacaoAdicionada: newWeeklyScore });
      toast.success('Atendimento finalizado e pontuação semanal atualizada!', { position: "bottom-center" });
      navigate('/agenda');
    } catch (error) {
      console.error("Erro ao finalizar o atendimento e pontuar:", error);
      toast.error("Não foi possível finalizar o atendimento. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };

    if (loading) return <div className="text-white text-center p-10">Carregando detalhes do cliente...</div>;
  if (!cliente) return <div className="text-white text-center p-10">Cliente não encontrado.</div>;

  let isServiceReady = false;
  let serviceDateMessage = '';
  if (cliente?.data && typeof cliente.data === 'string') {
    const dateParts = cliente.data.split('/');
    const timeParts = cliente.hora ? cliente.hora.split(':') : [8, 0];
    const serviceDateTime = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), parseInt(timeParts[0]), parseInt(timeParts[1]));
    const timeToStart = serviceDateTime.getTime() - new Date().getTime();
    const oneAndHalfHoursInMs = 1.5 * 60 * 60 * 1000;
    if (timeToStart <= oneAndHalfHoursInMs) {
      isServiceReady = true;
    }
    const readyTime = new Date(serviceDateTime.getTime() - oneAndHalfHoursInMs);
    const formattedDate = readyTime.toLocaleDateString('pt-BR');
    const formattedTime = readyTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    serviceDateMessage = `Você poderá iniciar o deslocamento a partir das ${formattedTime} do dia ${formattedDate}.`;
  }
  
  let itensArray = [];
  if (Array.isArray(cliente?.itens_cliente)) {
    itensArray = cliente.itens_cliente.filter(item => item && item.trim() !== '');
  } else if (typeof cliente?.itens_cliente === 'string' && cliente.itens_cliente.trim() !== '') {
    itensArray = [cliente.itens_cliente];
  }

return (
    <>
      <div className="bg-gray-900 min-h-screen p-4 sm:p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to={isOwner ? "/meus-servicos" : "/lista"} className="text-blue-400 hover:text-blue-300">
              &larr; Voltar
            </Link>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div
              className={`bg-gray-800 p-8 rounded-lg shadow-xl transition-all duration-500 ease-in-out cursor-pointer hover:bg-gray-800 ${isDetailsExpanded ? 'md:col-span-2' : 'md:col-span-1'}`}
              onClick={() => setIsDetailsExpanded( cliente.status == "cheguei"?  !isDetailsExpanded: isDetailsExpanded )}
            >
              <h2 className="text-3xl font-bold mb-6 border-b border-gray-800 pb-4">{isDetailsExpanded ? 'Detalhes do Agendamento': "Clique para acessar os Detalhes"}</h2>
              
              <div className={`transition-all duration-200 ease-in-out overflow-hidden ${isDetailsExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-brand-blue truncate">OS - {cliente.ultimos4}</h1>
{canViewSensitiveData ? (
                <p className="text-lg text-white">{cliente?.quem_recebe}</p>
              ) : (
                <p className="text-yellow-500 text-sm italic">Nome do Cliente (Visível ao iniciar o deslocamento)</p>
              )}
                  <div className="flex items-start">
                    <MdOutlineCalendarToday className="mr-4 text-3xl text-brand-blue flex-shrink-0" />
                    <div>
                      <p className="text-gray-300 text-xl font-medium">{`${cliente?.data} - ${cliente?.hora || cliente?.turno}`}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MdOutlineLocationOn className="mr-4 text-3xl text-brand-blue flex-shrink-0" />
                    <div>
                      <p className="text-gray-300 text-lg font-medium">{`${cliente?.endereco_cliente}, ${cliente?.bairro}, ${cliente?.cidade} - ${cliente?.Estado}`}</p>
                      {canViewSensitiveData ? (
                        <p className="text-white text-sm mt-1">{`Complemento: ${cliente?.complemento_endereco}`}</p>
                      ) : (
                        <p className="text-yellow-500 text-sm italic">Complemento: (Visível ao iniciar o deslocamento)</p>
                      )}
                    </div>
                  </div>
                  
                  <hr className="border-gray-800 my-4" />
                  
                  {itensArray.length > 0 && (
                    <div className="flex items-start">
                      <MdFormatListBulleted className="mr-4 text-3xl text-brand-blue flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        {itensArray.map((item, index) => (
                          <p key={index} className="text-gray-200 text-lg">{item}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {cliente?.observacoesAdicionaisCliente && cliente.observacoesAdicionaisAdicionaisCliente !== 'Nenhuma' && cliente.observacoesAdicionaisCliente !== 'a' && (
                      <div className="flex items-start">
                        <MdInfoOutline className="mr-4 text-3xl text-brand-blue flex-shrink-0" />
<p className="text-gray-300 text-lg whitespace-pre-wrap">{cliente?.observacoesAdicionaisCliente}</p>                      </div>
                  )}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <div className="bg-green-600 p-4 rounded-lg flex items-center justify-between shadow-md">
                    <p className="flex items-center text-xl font-medium text-white"><MdAttachMoney className="mr-3 text-2xl" /> Valor a Receber:</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {cliente?.parceiropercentual ? cliente.parceiropercentual.toFixed(2).replace('.', ',') : 'A combinar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`bg-gray-800 p-8 rounded-lg shadow-xl transition-all duration-500 ease-in-out ${isDetailsExpanded ? 'md:col-span-1' : 'md:col-span-2'}`}
            >
              {canViewSensitiveData ? (
                <h3 className="text-2xl font-bold text-white mb-4">Ações no Local</h3>
              ) : (
                <p className="text-yellow-500 text-sm italic"> </p>
              )}
              
              {isOwner && (cliente?.status === 'cheguei' || cliente?.status === 'aguardandopagamento') && (
                <ActionCarousel
                  step={carouselStep}
                  clientData={cliente}
                  onNext={() => setCarouselStep(prev => prev + 1)}
                  onPrev={() => setCarouselStep(prev => prev - 1)}
                  onFinish={() => setChecklistStep(null)}
                />
              )}
              {cliente?.status === 'disponivel' && (
                <>
                  <p className="text-sm text-gray-400">Serviços aceitos hoje: {dailyJobCount?.accepted} / {dailyJobCount?.limit === Infinity ? 'Ilimitado' : dailyJobCount?.limit}</p>
                  {!actionLoading && !canAcceptJob.can && canAcceptJob.reason && (<p className="text-yellow-500 text-sm pt-2">{canAcceptJob.reason}</p>)}
                  <button
                    onClick={handleClaimJob}
                    disabled={actionLoading || !canAcceptJob.can}
                    className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                    {actionLoading ? <LoadingSpinner /> : 'Aceitar este Serviço'}
                  </button>
                </>
              )}
              {isOwner && cliente?.status === 'aceito' && (
                <>
                  <button onClick={handleStartTrip} disabled={actionLoading || !isServiceReady} className="w-full max-w-sm mx-auto bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                    {actionLoading ? <LoadingSpinner /> : 'Iniciar Deslocamento'}
                  </button>
                  <div className="text-center mt-6">
                    <button onClick={handleOpenCancelModal} disabled={actionLoading} className="text-gray-200 hover:text-red-500 text-sm underline transition">Cancelar Serviço</button>
                  </div>
                  {!isServiceReady && serviceDateMessage && (<p className="text-yellow-500 text-sm mt-2">{serviceDateMessage}</p>)}
                </>
              )}
              {isOwner && cliente?.status === 'deslocamento' && (
                <button onClick={handleArrived} disabled={actionLoading} className="w-full max-w-sm mx-auto bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                  {actionLoading ? <LoadingSpinner /> : 'Cheguei ao Local'}
                </button>
              )}
              {isOwner && cliente?.status === 'aguardandopagamento' && (
                <div className="p-4 bg-gray-800 rounded-lg text-center">
                  <p className="font-bold text-lg text-yellow-500">Aguardando pagamento do cliente...</p>
                  <p className="text-sm text-gray-400 mt-2">O link já foi enviado. Não é necessário fazer mais nada no momento.</p>
                </div>
              )}
              {isOwner && cliente?.status === 'finalizado' && (
                <div className="p-4 bg-gray-800 rounded-lg text-center">
                  <p className="font-bold text-lg text-go-green">Serviço Finalizado!</p>
                  <p className="text-sm text-gray-400 mt-2">Este serviço foi concluído com sucesso.</p>
                </div>
              )}
              {isOwner && ['aceito'].includes(cliente?.status) && (
                <div className="text-center mt-4">
                </div>
              )}
              {actionError && <p className="text-red-500 mt-4">{actionError}</p>}
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal show={showConfirmation} onClose={() => { setShowConfirmation(false); navigate('/lista'); }} onNavigate={() => { setShowConfirmation(false); navigate('/meus-servicos'); }} title="Serviço Aceito!" message="Você aceitou este serviço. Ele foi adicionado à sua lista de serviços ativos." animation={successAnimation}/>
      <ActionConfirmationModal show={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancel} isLoading={actionLoading} title={cancelMessage.title} message={cancelMessage.message} confirmText="Sim, Cancelar" confirmButtonClass="bg-red-600 hover:bg-red-700"/>
      <ConfirmationModal show={showPaymentSuccessModal} onClose={() => setShowPaymentSuccessModal(false)} onNavigate={() => navigate('/meus-servicos')} title="Pagamento Confirmado!" message="O pagamento do cliente foi confirmado. O serviço foi finalizado com sucesso." animation={paymentAnimation}/>
      {showAlert.show && (<SimpleAlertModal title={showAlert.title} message={showAlert.message} onClose={() => setShowAlert({ ...showAlert, show: false })}/>)}
    </>
  );
}

export default ClientDetailPage;
