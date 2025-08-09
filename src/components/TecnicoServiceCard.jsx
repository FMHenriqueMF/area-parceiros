// src/components/TecnicoServiceCard.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../context/AuthContext.jsx';
import ActionConfirmationModal from './ActionConfirmationModal.jsx';
import { logUserActivity } from '../utils/logger.js'; 


const statusStyles = {
  aceito: { text: 'Aceito', color: 'bg-yellow-500', buttonText: 'Iniciar Deslocamento', nextStatus: 'deslocamento' },
  deslocamento: { text: 'Em Deslocamento', color: 'bg-blue-500', buttonText: 'Cheguei ao Local', nextStatus: 'cheguei' },
  cheguei: { text: 'Chegou ao Local', color: 'bg-teal-500', buttonText: 'Realizar Ações', nextStatus: null },
  aguardandopagamento: { text: 'Aguardando Pagamento', color: 'bg-purple-500', buttonText: 'Ver Detalhes', nextStatus: null },
  finalizado: { text: 'Finalizado', color: 'bg-gray-600', buttonText: 'Ver Detalhes', nextStatus: null },
};

function TecnicoServiceCard({ cliente }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentStatus = statusStyles[cliente.status] || { text: cliente.status, color: 'bg-gray-400', buttonText: 'Ver Detalhes' };

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


    }
  }

  const handleCardClick = () => {
    if (currentUser) {
      logUserActivity(currentUser.uid, 'Verificou o cliente pelo Meus Serviços', { clienteId: cliente.id , OS: cliente.ultimos4 });
    }
    navigate(`/servico/${cliente.id}`);
  };
  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();



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
      handleCardClick();
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
      await logUserActivity(currentUser.uid, 'Atualizou o Status', { 
        clienteId: cliente.id, 
        OS: cliente.ultimos4 || 'N/A',
        previousStatus: cliente.status,
        newStatus: currentStatus.nextStatus 
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
  const horario = cliente.turno || cliente.hora || '';


    return (
    <>
      <div onClick={handleCardClick} className="block h-full cursor-pointer">
        <div className={`bg-gray-800 rounded-lg shadow-lg border-2 ${borderColor} h-full flex flex-col justify-between p-4`}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white truncate">OS - {osNumber}</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${currentStatus.color}`}>
                {currentStatus.text}
              </span>
            </div>
            
            {/* LÓGICA DE RENDERIZAÇÃO DA STRING COMPLETA */}
            <div className="text-sm text-gray-400 space-y-1">
              {cliente.itens_cliente ? (
                <p className="whitespace-pre-line">{cliente.itens_cliente}</p>
              ) : (
                <p>Serviço não informado</p>
              )}
            </div>
            
            <p className="text-xs text-gray-500">{`${cliente.bairro}, ${cliente.cidade}`}</p>
          </div>

          <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-400 font-semibold">
              <div className="flex flex-col gap-1">
                <span className={isToday ? "text-status-orange" : ""}>
                    {isToday ? "🔥 É HOJE! " : ""}
                    {data}
                </span>
                {horario && <span>{horario}</span>}
              </div>
            </div>
            <button
              onClick={handleActionClick}
              className="bg-brand-blue hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg text-xs disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {currentStatus.buttonText}
            </button>
          </div>
        </div>
      </div>
      
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

export default TecnicoServiceCard;