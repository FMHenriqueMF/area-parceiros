// src/components/ClientCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import StaticMap from './StaticMap.jsx';
import { FiStar } from 'react-icons/fi'; // Importar o ícone de estrela

function ClientCard({ cliente }) {
  const osNumber = cliente.ultimos4 || 'N/A';
  const cidade = cliente.cidade || 'N/A';
  const bairro = cliente.bairro || 'N/A';
  const rua = cliente.endereco_cliente || 'N/A';
  const valor = cliente.parceiropercentual || 0;
  const itens = cliente.itens_cliente || 'Itens não especificados.';
  const observacoes = cliente.observacoesAdicionaisCliente || '';
  const isRecomendado = cliente.recomendado === true; // Verifica se o cliente é recomendado

  // Define a cor da borda com base no status de recomendado
  const borderColor = isRecomendado ? 'border-brand-yellow' : 'border-gray-700';
  const hoverBorderColor = isRecomendado ? 'hover:border-yellow-300' : 'hover:border-brand-blue';

  return (
    <Link to={`/cliente/${cliente.id}`} className="block h-full">
      <div className={`bg-gray-800 rounded-lg shadow-lg border-2 ${borderColor} ${hoverBorderColor} transition-all duration-300 h-full flex flex-col overflow-hidden relative`}>
        
        {/* SELO DE RECOMENDADO (só aparece se for true) */}
        {isRecomendado && (
<div className="absolute top-2 left-1/2 -translate-x-1/2 bg-brand-yellow text-black px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">            <FiStar />
            EXTREMA RECOMENDA
          </div>
        )}
        
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2 pt-2">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg font-bold text-brand-blue truncate">OS - {osNumber}</h2>
              <p className="text-xs text-gray-400 break-words">Cidade: {cidade}</p>
              <p className="text-xs text-gray-400 break-words">Bairro: {bairro}</p>
              <p className="text-xs text-gray-400 break-words">Rua: {rua}</p>
            </div>
            <div className="bg-go-green text-gray-900 font-bold py-1 px-3 rounded-md text-center flex-shrink-0">
              R${valor.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="my-2 border-t border-gray-700 pt-2">
            <p className="text-sm text-gray-300 font-semibold">Itens:</p>
            <p className="text-sm text-gray-400 line-clamp-2">{itens}</p>
            {observacoes && (
              <>
                <p className="text-sm text-gray-300 font-semibold mt-2">Obs:</p>
                <p className="text-sm text-gray-400 line-clamp-1">{observacoes}</p>
              </>
            )}
          </div>
        </div>
        
        <div className="h-24 w-full mt-auto">
          <StaticMap cliente={cliente} />
        </div>
      </div>
    </Link>
  );
}

export default ClientCard;