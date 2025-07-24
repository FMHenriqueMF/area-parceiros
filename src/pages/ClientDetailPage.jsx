// src/pages/ClientDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, runTransaction, updateDoc, serverTimestamp, collection, addDoc, deleteField, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StaticMap from '../components/StaticMap.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import PhotoUploader from '../components/PhotoUploader.jsx';
import ActionConfirmationModal from '../components/ActionConfirmationModal.jsx';
import { FiStar } from 'react-icons/fi'; // // Importar o ícone de estrela

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

  useEffect(() => {
    setLoading(true);
    if (!id) return;
    const docRef = doc(db, 'clientes', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCliente({ id: docSnap.id, ...docSnap.data() });
      } else { 
        console.log("Cliente não encontrado ou foi deletado!");
        setCliente(null); 
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao escutar o cliente:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (cliente?.RelatotecnicoItens) {
      setExtraInfo(cliente.RelatotecnicoItens);
    } else {
      setExtraInfo('');
    }
  }, [cliente]);

  const addLogEntry = async (newStatus, responsavel = currentUser.nome_empresa) => {
    if (!id) return;
    try {
      const logCollectionRef = collection(db, 'clientes', id, 'logs_parceiro');
      await addDoc(logCollectionRef, {
        clienteId: id,
        clienteNome: cliente?.quem_recebe || '',
        status: newStatus,
        timestamp: serverTimestamp(),
        responsavel: responsavel,
        parceiroId: currentUser.uid,
        parceiroNome: currentUser.nome_empresa
      });
    } catch (error) {
      console.error("Erro ao criar entrada de log:", error);
    }
  };
  
  const handleClaimJob = async () => {
    setActionLoading(true);
    setActionError('');
    if (!currentUser?.nome_empresa) {
      setActionError("Não foi possível encontrar o nome da sua empresa. Verifique seu perfil.");
      setActionLoading(false);
      return;
    }
    try {
      const clientRef = doc(db, "clientes", id);
      await runTransaction(db, async (transaction) => {
        const clientDoc = await transaction.get(clientRef);
        if (!clientDoc.exists()) throw new Error("Este cliente não está mais disponível!");
        if (clientDoc.data().status !== 'disponivel') throw new Error("Este cliente já foi pego.");
        
        transaction.update(clientRef, { 
          status: 'aceito', 
          aceito_por: currentUser.nome_empresa,
          parceiroId: currentUser.uid,
        });
      });
      await addLogEntry('aceito');
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
      await addLogEntry('deslocamento');
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
      await addLogEntry('cheguei');
    } catch (error) {
      console.error("Erro ao marcar chegada:", error);
      setActionError("Não foi possível atualizar o status. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPaymentLink = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const clientRef = doc(db, "clientes", id);
      await updateDoc(clientRef, { status: 'aguardandopagamento' });
      await addLogEntry('aguardandopagamento');
      
      alert('Link de pagamento (simulado) foi enviado ao cliente!');
      setActionLoading(false);
      
      setTimeout(async () => {
        await updateDoc(clientRef, { status: 'finalizado' });
        await addLogEntry('finalizado', 'Sistema (Pagamento Aprovado)');
        navigate('/meus-servicos');
      }, 8000);

    } catch (error) {
      console.error("Erro na simulação de pagamento:", error);
      setActionError("Ocorreu um erro ao atualizar o status.");
      setActionLoading(false);
    }
  };

  const handlePhotosUploaded = async (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0) return;
    try {
      const clientRef = doc(db, "clientes", id);
      await updateDoc(clientRef, {
        fotos: arrayUnion(...imageUrls)
      });
      alert('Fotos enviadas com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar URLs das fotos:", error);
      alert('Ocorreu um erro ao salvar as fotos. Tente novamente.');
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
      alert('Informações salvas com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar informações extras:", error);
      setActionError("Não foi possível salvar as informações. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCancelModal = () => {
    if (!cliente?.data) {
      alert("Não é possível cancelar um serviço sem data definida.");
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
        message: "Você tem certeza que deseja cancelar este serviço? Ele voltará para o mural e ficará disponível para outros parceiros.",
      });
    }
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    setActionLoading(true);
    try {
      const clientRef = doc(db, "clientes", id);
      await updateDoc(clientRef, {
        status: 'disponivel',
        aceito_por: deleteField(),
        parceiroId: deleteField()
      });
      await addLogEntry('cancelado');
      alert('Serviço cancelado e devolvido ao mural.');
      navigate('/meus-servicos');
    } catch (error) {
      console.error("Erro ao cancelar serviço:", error);
      alert("Não foi possível cancelar o serviço.");
    } finally {
      setActionLoading(false);
      setIsCancelModalOpen(false);
    }
  };

  if (loading) return <div className="text-white text-center p-10">Carregando detalhes do cliente...</div>;
  if (!cliente) return <div className="text-white text-center p-10">Cliente não encontrado.</div>;

  const isOwner = currentUser && cliente && currentUser.uid === cliente.parceiroId;
  const canViewSensitiveData = isOwner && ['deslocamento', 'cheguei', 'aguardandopagamento', 'finalizado'].includes(cliente.status);
  const isRecomendado = cliente?.recomendado === true; // // Verifica se o cliente é recomendado

  let isServiceReady = false;
  let serviceDateMessage = '';
  if (cliente?.data && typeof cliente.data === 'string') {
    const dateParts = cliente.data.split('/');
    if (dateParts.length === 3) {
      const serviceDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
      let serviceHour = 0, serviceMinute = 0;

      if (cliente.turno) {
        if (cliente.turno.toLowerCase().includes('manhã')) serviceHour = 8;
        else if (cliente.turno.toLowerCase().includes('tarde')) serviceHour = 12;
      } else if (cliente.hora) {
        const timeParts = cliente.hora.split(':');
        if (timeParts.length === 2) {
          serviceHour = parseInt(timeParts[0], 10);
          serviceMinute = parseInt(timeParts[1], 10);
        }
      }
      
      serviceDate.setHours(serviceHour, serviceMinute, 0, 0);
      const now = new Date();
      const timeDifference = serviceDate.getTime() - now.getTime();
      const oneAndHalfHoursInMs = 1.5 * 60 * 60 * 1000;

      if (timeDifference <= oneAndHalfHoursInMs) {
        isServiceReady = true;
      } else {
        const releaseTime = new Date(serviceDate.getTime() - oneAndHalfHoursInMs);
        const formattedTime = releaseTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        serviceDateMessage = `Disponível para iniciar a partir das ${formattedTime} de ${cliente.data}`;
      }
    }
  }

  return (
    <>
      <div className="bg-gray-900 min-h-screen p-4 sm:p-8 text-white">
        <div className="max-w-4xl mx-auto relative"> {/* Torna o contêiner pai relativo para posicionamento absoluto do selo */}
          {/* SELO DE RECOMENDADO (só aparece se for true) */}
          {isRecomendado && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-yellow text-black px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1 shadow-lg z-10"> {/* Ajusta top e remove translate-y para evitar corte */}
              <FiStar /> {/* */}
              EXTREMA RECOMENDA {/* */}
            </div>
          )}

          <div className="mb-6">
            <Link to={isOwner ? "/meus-servicos" : "/mural"} className="text-blue-400 hover:text-blue-300">
              &larr; Voltar
            </Link>
          </div>
          
          <div className="flex justify-between items-start flex-wrap gap-4 mb-6 mt-8"> {/* Adiciona mt-8 para criar espaço para o selo */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{cliente.servicoContratado || 'Serviço de Higienização'}</h1>
              {canViewSensitiveData ? (
                <p className="text-lg text-gray-400">{cliente.quem_recebe}</p>
              ) : (
                <p className="text-yellow-500 text-sm italic">Nome do Cliente (Visível ao iniciar o deslocamento)</p>
              )}
            </div>
            <div className="w-full sm:w-48 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-700">
              <StaticMap cliente={cliente} />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Detalhes para Análise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
               <div className="md:col-span-2">
                <p className="font-bold">Agendamento</p>
                <p className="text-gray-300 text-lg">{`${cliente.data} - ${cliente.turno || cliente.hora}`}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-bold">Localização</p>
                <p className="text-gray-300">{`${cliente.endereco_cliente}, ${cliente.bairro}, ${cliente.cidade} - ${cliente.Estado}`}</p>
              </div>
              <div>
                <p className="font-bold">Complemento:</p>
                {canViewSensitiveData ? (
                  <p className="text-gray-300">{cliente.complemento_endereco || 'Não informado'}</p>
                ) : (
                  <p className="text-yellow-500 text-sm italic">Visível ao iniciar o deslocamento</p>
                )}
              </div>
              <div className="md:col-span-2"><hr className="border-gray-700 my-2" /></div>
              <div className="md:col-span-2">
                <p className="font-bold">Itens para Higienização:</p>
                <p className="text-gray-300 whitespace-pre-wrap line-clamp-2">{cliente.itens_cliente || 'Não especificado'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-bold">Observações Adicionais:</p>
                <p className="text-gray-300 whitespace-pre-wrap line-clamp-2">{cliente.observacoesAdicionaisCliente || 'Nenhuma'}</p>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-700 pt-4">
              <p className="text-2xl font-bold text-go-green">
                Valor a Receber: R$ {cliente.parceiropercentual ? cliente.parceiropercentual.toFixed(2).replace('.', ',') : 'A combinar'}
              </p>
            </div>
          </div>

          <div className="text-center space-y-4">
            {cliente.status === 'disponivel' && (
              <button onClick={handleClaimJob} disabled={actionLoading} className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                {actionLoading ? <LoadingSpinner /> : 'Aceitar este Serviço'}
              </button>
            )}
            {isOwner && cliente.status === 'aceito' && (
              <>
                <button onClick={handleStartTrip} disabled={actionLoading || !isServiceReady} className="w-full max-w-sm mx-auto bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                  {actionLoading ? <LoadingSpinner /> : 'Iniciar Deslocamento'}
                </button>
                {!isServiceReady && serviceDateMessage && (<p className="text-yellow-500 text-sm mt-2">{serviceDateMessage}</p>)}
              </>
            )}
             {isOwner && cliente.status === 'deslocamento' && (
              <button onClick={handleArrived} disabled={actionLoading} className="w-full max-w-sm mx-auto bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                {actionLoading ? <LoadingSpinner /> : 'Cheguei ao Local'}
              </button>
            )}
            {isOwner && ['cheguei', 'aguardandopagamento'].includes(cliente.status) && (
              <div className="p-6 bg-gray-700 rounded-lg">
                <h3 className="text-2xl font-bold text-white mb-4">Ações no Local</h3>
                <div className="space-y-4">
                  <PhotoUploader clienteId={id} onUploadComplete={handlePhotosUploaded} />
                  <div>
                    <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Adicionar relatório técnico do atendimento..." rows={3} />
                    <button onClick={handleSaveExtraInfo} disabled={actionLoading} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50">
                      {actionLoading ? <LoadingSpinner /> : 'Salvar Relatório'}
                    </button>
                  </div>
                  <button onClick={handleSendPaymentLink} disabled={actionLoading || cliente.status !== 'cheguei'} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                    {actionLoading ? <LoadingSpinner /> : 'Enviar Link de Pagamento'}
                  </button>
                </div>
              </div>
            )}
             {isOwner && cliente.status === 'finalizado' && (
                <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <p className="font-bold text-lg text-go-green">Serviço Finalizado!</p>
                    <p className="text-sm text-gray-400 mt-2">Este serviço foi concluído com sucesso.</p>
                </div>
             )}

            {/* --- CONDIÇÃO DO BOTÃO DE CANCELAR ATUALIZADA --- */}
            {isOwner && cliente.status === 'aceito' && (
              <button
                onClick={handleOpenCancelModal}
                disabled={actionLoading}
                className="text-gray-400 hover:text-red-500 text-sm underline transition"
              >
                Cancelar Serviço
              </button>
            )}
            
            {actionError && <p className="text-red-500 mt-4">{actionError}</p>}
          </div>
        </div>
      </div>

      <ConfirmationModal 
        show={showConfirmation}
        onClose={() => { setShowConfirmation(false); navigate('/mural'); }}
        onNavigate={() => { setShowConfirmation(false); navigate('/meus-servicos'); }}
      />
      
      <ActionConfirmationModal
        show={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        isLoading={actionLoading}
        title={cancelMessage.title}
        message={cancelMessage.message}
        confirmText="Sim, Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </>
  );
}

export default ClientDetailPage;