// src/components/carousel/PageServiceSummary.jsx

import React from 'react';
import { FiCheckCircle, FiEdit } from 'react-icons/fi';

const PageServiceSummary = ({ clientData, onNext, onPrev }) => {

  const handleConfirm = () => {
    onNext();
  };

  const handleAlterar = () => {
    onPrev();
  };

  // Lógica para determinar os itens a serem exibidos
  let itensParaExibir = [];
  if (Array.isArray(clientData.itens_cliente)) {
    // Se for um array, usamos ele diretamente
    itensParaExibir = clientData.itens_cliente;
  } else if (typeof clientData.itens_cliente === 'string' && clientData.itens_cliente.length > 0) {
    // Se for uma string, a colocamos como um único item na lista
    itensParaExibir = [clientData.itens_cliente];
    // Se a string puder ter múltiplos itens separados por vírgula, por exemplo,
    // você poderia fazer:
    // itensParaExibir = clientData.itens_cliente.split(',');
  }

  return (
    <div className="flex flex-col space-y-8 p-6 bg-gray-900 rounded-xl shadow-lg">
      <div className="flex flex-col items-center">
        <h4 className="text-2xl font-bold flex items-center space-x-3 text-green-700">
          <FiCheckCircle size={30} />
          <span>Confirme os itens do serviço</span>
        </h4>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <ul className="list-none space-y-2">
          {itensParaExibir.length > 0 ? (
            itensParaExibir.map((item, index) => (
              <li key={index} className="text-gray-200 text-xl">
                • {item.trim()}
              </li>
            ))
          ) : (
            <li className="text-gray-400 italic">Nenhum item selecionado.</li>
          )}
        </ul>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handleAlterar}
          className="text-white font-semibold px-8 py-2 rounded-lg text-sm hover:bg-gray-700 flex items-center space-x-2 transition duration-300 border border-white"
        >
          <FiEdit size={20} />
          <span>Alterar itens</span>
        </button>
        <button
          onClick={handleConfirm}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 shadow-md"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default PageServiceSummary;