// src/components/MyServiceClientCard.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ActionConfirmationModal from './ActionConfirmationModal.jsx';

const statusStyles = {
  aceito: { text: 'Aceito', color: 'bg-yellow-500', buttonText: 'Iniciar Deslocamento', nextStatus: 'deslocamento' },
  deslocamento: { text: 'Em Deslocamento', color: 'bg-blue-500', buttonText: 'Cheguei ao Local', nextStatus: 'cheguei' },
  cheguei: { text: 'Chegou ao Local', color: 'bg-teal-500', buttonText: 'Realizar Ações', nextStatus: null },
  aguardandopagamento: { text: 'Aguardando Pagamento', color: 'bg-purple-500', buttonText: 'Ver Detalhes', nextStatus: null },
  finalizado: { text: 'Finalizado', color: 'bg-gray-600', buttonText: 'Ver Detalhes', nextStatus: null },
};

function MyServiceClientCard({ cliente }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentStatus = statusStyles[cliente.status] || { text: cliente.status, color: 'bg-gray-400', buttonText: 'Ver Detalhes' };

  let isServiceReady = false;
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
      }
    }
  }
  // -----------------------------------------------------------

  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Bloqueia a ação se o serviço não estiver pronto
    if (currentStatus.nextStatus === 'deslocamento' && !isServiceReady) {
      alert(`Este serviço só pode ser iniciado 1h30min antes do horário agendado.`);
      return;
    }

    if (currentStatus.nextStatus === 'deslocamento') {
      setIsModalOpen(true);
    } else {
      handleConfirmUpdate();
    }
  };

  const handleConfirmUpdate = async () => {
    setIsLoading(true);
    await handleUpdateStatus();
    setIsLoading(false);
    setIsModalOpen(false);
  };

  const handleUpdateStatus = async () => {
    if (!currentStatus.nextStatus) {
      navigate(`/cliente/${cliente.id}`);
      return;
    }
    if (!currentUser) {
      alert("Erro: Usuário não encontrado.");
      return;
    }
    const clientRef = doc(db, "clientes", cliente.id);
    try {
      await updateDoc(clientRef, { status: currentStatus.nextStatus });
      const logCollectionRef = collection(db, 'clientes', cliente.id, 'logs_parceiro');
      await addDoc(logCollectionRef, {
        clienteId: cliente.id,
        status: currentStatus.nextStatus,
        timestamp: serverTimestamp(),
        responsavel: currentUser.nome_empresa,
        parceiroId: currentUser.uid,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Não foi possível atualizar o status.");
    }
  };
  
  let isToday = false;
  if (cliente?.data && typeof cliente.data === 'string') {
    const dateParts = cliente.data.split('/');
    if (dateParts.length === 3) {
      const serviceDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
      const today = new Date();
      if (serviceDate.getFullYear() === today.getFullYear() &&
          serviceDate.getMonth() === today.getMonth() &&
          serviceDate.getDate() === today.getDate()) {
        isToday = true;
      }
    }
  }
  const borderColor = isToday ? 'border-status-orange' : 'border-gray-700';
  const osNumber = cliente.ultimos4 || 'N/A';
  const data = cliente.data || 'Sem data';
    const horario = cliente.turno || cliente.hora || ''; // Pega o turno ou a hora


    return (
    <>
      <Link to={`/cliente/${cliente.id}`} className="block h-full">
        <div className={`bg-gray-800 rounded-lg shadow-lg border-2 ${borderColor} h-full flex flex-col justify-between p-4`}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white truncate">OS - {osNumber}</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${currentStatus.color}`}>
                {currentStatus.text}
              </span>
            </div>
            <p className="text-sm text-gray-400">{cliente.servicoContratado || 'Serviço não informado'}</p>
            <p className="text-xs text-gray-500">{`${cliente.bairro}, ${cliente.cidade}`}</p>
          </div>

          <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-400 font-semibold">
              {isToday ? (
                <span className="text-status-orange flex items-center gap-2">🔥 É HOJE! <span className="text-gray-400 font-normal">{horario}</span></span>
              ) : (
                <span>{data}</span>
              )}
            </div>
            <button
              onClick={handleActionClick}
              disabled={cliente.status === 'aceito' && !isServiceReady}
              className="bg-brand-blue hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg text-xs disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {currentStatus.buttonText}
            </button>
          </div>
        </div>
      </Link>
      
      <ActionConfirmationModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmUpdate}
        isLoading={isLoading}
        title="Iniciar Deslocamento?"
        message="Ao confirmar, seu aplicativo será focado nesta tarefa e você não poderá ver outros serviços até a finalização."
        confirmText="Sim, Iniciar"
        confirmButtonClass="bg-yellow-500 hover:bg-yellow-600 text-black"
      />
    </>
  );
}

export default MyServiceClientCard;