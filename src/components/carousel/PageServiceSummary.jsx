// src/components/carousel/PageServiceSummary.jsx

import React from 'react';
import { FiCheckCircle, FiEdit } from 'react-icons/fi';

const PageServiceSummary = ({ clientData, onNext, onPrev }) => {

  const handleConfirm = () => {
    // Avança para a página de fotos
    onNext();
  };

  const handleAlterar = () => {
    // Volta para a página de edição (página 1, índice 0)
    onPrev();
  };

  return (
    <div className="flex flex-col space-y-4">
      <h4 className="text-xl font-semibold flex items-center space-x-2 text-brand-blue">
        <FiCheckCircle size={24} />
        <span>Confirmar itens do serviço</span>
      </h4>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-400 font-bold mb-2">Os itens do serviço são esses:</p>
        <p className="text-white">{clientData.itens_cliente}</p>
      </div>
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handleAlterar}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500 flex items-center space-x-2 transition duration-300"
        >
          <FiEdit size={16} />
          <span>Alterar itens</span>
        </button>
        <button
          onClick={handleConfirm}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default PageServiceSummary;