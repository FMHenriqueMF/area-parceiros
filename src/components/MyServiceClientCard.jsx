// src/components/MyServiceClientCard.jsx

import React, { useState } from 'react'; // Importar useState
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ActionConfirmationModal from './ActionConfirmationModal.jsx'; // 1. Importar o novo modal


const statusStyles = {
  aceito: { text: 'Aceito', color: 'bg-yellow-500', buttonText: 'Iniciar Deslocamento', nextStatus: 'deslocamento' },
  deslocamento: { text: 'Em Deslocamento', color: 'bg-blue-500', buttonText: 'Cheguei ao Local', nextStatus: 'cheguei' },
  cheguei: { text: 'Chegou ao Local', color: 'bg-teal-500', buttonText: 'Realizar Ações', nextStatus: null },
  aguardandopagamento: { text: 'Aguardando Pagamento', color: 'bg-purple-500', buttonText: 'Ver Detalhes', nextStatus: null },
  finalizado: { text: 'Finalizado', color: 'bg-gray-600', buttonText: 'Ver Detalhes', nextStatus: null },
};

function MyServiceClientCard({ cliente }) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); // 2. Estado para controlar o modal
  const [isLoading, setIsLoading] = useState(false); // Estado para o spinner do modal

  const currentStatus = statusStyles[cliente.status] || { text: cliente.status, color: 'bg-gray-400', buttonText: 'Ver Detalhes' };

  // A função que o botão principal chama
  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Se a ação for 'Iniciar Deslocamento', abre o modal. Senão, executa a ação.
    if (currentStatus.nextStatus === 'deslocamento') {
      setIsModalOpen(true);
    } else {
      handleUpdateStatus();
    }
  };

  // A função que o modal confirma e executa
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

    const clientRef = doc(db, "clientes", cliente.id);
    try {
      await updateDoc(clientRef, {
        status: currentStatus.nextStatus
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Não foi possível atualizar o status.");
    }
  };

  const osNumber = cliente.ultimos4 || 'N/A';
  const data = cliente.data || 'Sem data';

  // --- NOVA LÓGICA PARA VERIFICAR SE O SERVIÇO É HOJE ---
  let isToday = false;
  if (cliente?.data && typeof cliente.data === 'string') {
    const dateParts = cliente.data.split('/');
    if (dateParts.length === 3) {
      const serviceDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
      const today = new Date();
      
      // Compara ano, mês e dia para ver se são iguais
      if (serviceDate.getFullYear() === today.getFullYear() &&
          serviceDate.getMonth() === today.getMonth() &&
          serviceDate.getDate() === today.getDate()) {
        isToday = true;
      }
    }
  }
  // ----------------------------------------------------

  // Define a cor da borda com base se o serviço é hoje
  const borderColor = isToday ? 'border-status-orange' : 'border-gray-700';

  return (
    <>
    <Link to={`/cliente/${cliente.id}`} className="block">
      {/* Adicionamos a borda dinâmica aqui */}
      <div className={`bg-gray-800 rounded-lg shadow-lg border-2 ${borderColor} h-full flex flex-col justify-between p-4`}>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-white truncate">OS - {osNumber}</h3>
            {/* O Selo de Status Colorido */}
            <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${currentStatus.color}`}>
              {currentStatus.text}
            </span>
          </div>
          <p className="text-sm text-gray-400">{cliente.servicoContratado || 'Serviço não informado'}</p>
          <p className="text-xs text-gray-500">{`${cliente.bairro}, ${cliente.cidade}`}</p>
        </div>

        <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {/* Se for hoje, mostra o selo especial */}
            {isToday ? (
              <span className="font-bold text-status-orange">🔥 É HOJE!</span>
            ) : (
              data
            )}
          </div>
<button
              onClick={handleActionClick} // 3. O botão agora chama handleActionClick
              className="bg-brand-blue hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg text-xs"
            >
              {currentStatus.buttonText}
            </button>
        </div>
      </div>
    </Link>

          {/* 4. O Modal de Confirmação, renderizado mas invisível */}
      <ActionConfirmationModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmUpdate}
        isLoading={isLoading}
        title="Iniciar Deslocamento?"
        message="Ao confirmar, seu aplicativo será focado nesta tarefa e você não poderá ver outros serviços até a finalização."
      />
    </>
  );
}

export default MyServiceClientCard;