// src/components/ClientCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import StaticMap from './StaticMap.jsx';
import { FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../utils/logger.js';

function ClientCard({ cliente }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleClick = () => {
    if (currentUser) {
      logUserActivity(currentUser.uid, 'Verificou o cliente pelo Mural', { clienteId: cliente.id ,OS: cliente.ultimos4});
    }
    navigate(`/cliente/${cliente.id}`);
  };

  const osNumber = cliente.ultimos4 || 'N/A';
  const cidade = cliente.cidade || 'N/A';
  const bairro = cliente.bairro || 'N/A';
  const rua = cliente.endereco_cliente || 'N/A';
  const valor = parseFloat(cliente.parceiropercentual)|| 'Consultar';
  const valorFormatado = !isNaN(valor) ? `R$${valor.toFixed(2).replace('.', ',')}` : 'Consultar';
  const observacoes = cliente.observacoesAdicionaisCliente || '';
  const isRecomendado = cliente.recomendado === true;

  // Novos campos para data e horário/turno
  const data = cliente.data || 'N/A';
  const horarioOuTurno = cliente.hora || cliente.turno || 'N/A';

  // Lógica para verificar se a data é hoje e aplicar o estilo
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
  
  // Define as classes de borda com base nas condições
  let borderColor = isRecomendado ? 'border-brand-yellow' : 'border-gray-700';
  let hoverBorderColor = isRecomendado ? 'hover:border-yellow-300' : 'hover:border-brand-blue';

  if (isToday) {
    borderColor = 'border-orange-500'; // Borda laranja para hoje
    hoverBorderColor = 'hover:border-orange-400';
  }

  // AQUI É A PARTE ATUALIZADA PARA TRATAR ARRAY OU STRING
  const itens = cliente.itens_cliente;
  const temItens = itens && (Array.isArray(itens) && itens.length > 0 || typeof itens === 'string' && itens.trim() !== '');

  return (
    <div onClick={handleClick} className="block h-full cursor-pointer">
      <div className={`bg-gray-800 rounded-lg shadow-lg border-2 ${borderColor} ${hoverBorderColor} transition-all duration-300 h-full flex flex-col overflow-visible relative`}>
        {isRecomendado && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-yellow text-black px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
            <FiStar />
            EXTREMA RECOMENDA
          </div>
        )}
        <div className="p-4 flex flex-col flex-grow">
          {/* Adicionando a exibição da data e horário/turno */}

          <div className="flex justify-between items-start mb-2 pt-2">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg font-bold text-brand-blue truncate">OS - {osNumber}</h2>
              <p className="text-xs text-gray-400 break-words">Cidade: <span className="text-white">{cidade}</span></p>              
              <p className="text-xs text-gray-400 break-words">Bairro: <span className="text-white">{bairro}</span> </p>
              <p className="text-xs text-gray-400 break-words">Rua: <span className="text-white">{rua}</span></p>
            </div>
            <div className="bg-go-green text-gray-900 font-bold py-1 px-3 rounded-md text-center flex-shrink-0">
              {valorFormatado}
            </div>
          </div>
          
          <div className="my-2 border-t border-gray-700 pt-2"></div>
          <div className="flex justify-between items-center mb-2">
            <p className={`text-xs font-bold ${isToday ? 'text-orange-400' : 'text-white'}`}>
              {isToday ? '🔥 É HOJE!' : `Data: ${data}`} - {horarioOuTurno}
            </p>
          </div>
          
          <p className="text-sm text-gray-300 font-semibold">Itens:</p>
          {temItens ? (
            Array.isArray(itens) ? (
              itens.map((item, index) => (
                <p key={index} className="text-sm text-gray-400">{item}</p>
              ))
            ) : (
              <p className="text-sm text-gray-400">{itens}</p>
            )
          ) : (
            <p className="text-sm text-gray-400">Itens não especificados.</p>
          )}
          
          {observacoes && (
            <>
              <p className="text-sm text-gray-300 font-semibold mt-2">Obs:</p>
              <p className="text-sm text-gray-400 line-clamp-1">{observacoes}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientCard;