// src/pages/ClientDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, runTransaction, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StaticMap from '../components/StaticMap.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import PhotoUploader from '../components/PhotoUploader.jsx';

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
      setExtraInfo(''); // Limpa o campo se não houver dados no DB
    }
  }, [cliente]);

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
          parceiroId: currentUser.uid
        });
      });
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
      await updateDoc(clientRef, {
        status: 'deslocamento'
      });
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
      await updateDoc(clientRef, {
        status: 'cheguei'
      });
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
      await updateDoc(clientRef, {
        status: 'aguardandopagamento'
      });
      alert('Link de pagamento (simulado) foi enviado ao cliente!');
      setActionLoading(false);
      console.log('Iniciando delay de 8 segundos para simular aprovação do pagamento...');
      setTimeout(async () => {
        console.log('Pagamento aprovado (simulado). Atualizando status para finalizado.');
        const finalClientRef = doc(db, "clientes", id);
        await updateDoc(finalClientRef, {
          status: 'finalizado'
        });
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

  if (loading) return <div className="text-white text-center p-10">Carregando detalhes do cliente...</div>;
  if (!cliente) return <div className="text-white text-center p-10">Cliente não encontrado.</div>;

  const isOwner = currentUser && cliente && currentUser.uid === cliente.parceiroId;
  const canViewComplemento = isOwner && ['deslocamento', 'cheguei', 'aguardandopagamento', 'finalizado'].includes(cliente.status);

  let isServiceReady = false;
  let serviceDateMessage = '';
  if (cliente?.data && typeof cliente.data === 'string') {
    const dateParts = cliente.data.split('/');
    if (dateParts.length === 3) {
      const serviceDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (today >= serviceDate) {
        isServiceReady = true;
      } else {
        serviceDateMessage = `Disponível para iniciar em: ${cliente.data}`;
      }
    }
  }

  return (
    <>
      <div className="bg-gray-900 min-h-screen p-4 sm:p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to={isOwner ? "/meus-servicos" : "/"} className="text-blue-400 hover:text-blue-300">
              &larr; Voltar
            </Link>
          </div>
          
          <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{cliente.servicoContratado || 'Serviço de Higienização'}</h1>
              <p className="text-lg text-gray-400">{cliente.quem_recebe || 'Cliente'}</p>
            </div>
            <div className="w-full sm:w-48 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-700">
              <StaticMap cliente={cliente} />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Detalhes para Análise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <p className="font-bold">Localização</p>
                <p className="text-gray-300">{`${cliente.endereco_cliente}, ${cliente.bairro}, ${cliente.cidade} - ${cliente.Estado}`}</p>
              </div>
              <div>
                <p className="font-bold">Complemento:</p>
                {canViewComplemento ? (
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

          <div className="text-center">
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
            {isOwner && ['cheguei', 'aguardandopagamento', 'finalizado'].includes(cliente.status) && (
              <div className="p-6 bg-gray-700 rounded-lg">
                <h3 className="text-2xl font-bold text-white mb-4">Ações no Local</h3>
                <div className="space-y-4">
                {/*  <PhotoUploader clienteId={id} onUploadComplete={handlePhotosUploaded} />*/}
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
            {actionError && <p className="text-red-500 mt-4">{actionError}</p>}
          </div>
        </div>
      </div>
      <ConfirmationModal show={showConfirmation} onClose={() => { setShowConfirmation(false); navigate('/'); }} onNavigate={() => { setShowConfirmation(false); navigate('/meus-servicos'); }} />
    </>
  );
}

export default ClientDetailPage;