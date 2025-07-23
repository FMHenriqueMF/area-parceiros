// src/components/ClientCard.jsx

import { Link } from 'react-router-dom';
import StaticMap from './StaticMap.jsx';

function ClientCard({ cliente }) {
  const osNumber = cliente.ultimos4 || 'N/A';
  const cidade = cliente.cidade || 'N/A';
  const bairro = cliente.bairro || 'N/A';
  const rua = cliente.endereco_cliente || 'N/A';
  const valor = cliente.parceiropercentual || 0;
  const itens = cliente.itens_cliente || 'Itens não especificados.';
  const observacoes = cliente.observacoesAdicionaisCliente || '';

  return (
    <Link to={`/cliente/${cliente.id}`} className="block h-full">
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 hover:border-brand-blue transition-all duration-300 h-full flex flex-col overflow-hidden">
        
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
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

          {/* SEÇÃO DE ITENS E OBSERVAÇÕES ADICIONADA DE VOLTA */}
          <div className="my-2 border-t border-gray-700 pt-2">
            <p className="text-sm text-gray-300 font-semibold">Itens:</p>
            {/* A classe 'line-clamp-2' limita o texto a 2 linhas e adiciona '...' */}
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