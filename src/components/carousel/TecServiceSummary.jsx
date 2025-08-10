import React from 'react';
import { FiCheckCircle, FiEdit } from 'react-icons/fi';


const TecServiceSummary = ({ clientData, onNext, onPrev }) => {
  let itens = [];

  // Verificação e conversão para garantir que 'itens' é sempre um array
  if (clientData && clientData.itens_cliente) {
    if (Array.isArray(clientData.itens_cliente)) {
      itens = clientData.itens_cliente;
    } else if (typeof clientData.itens_cliente === 'string') {
      itens = [clientData.itens_cliente];
    }
  }

  // Se 'itens' ainda estiver vazio após a verificação (ou se os dados não existirem),
  // você pode querer exibir uma mensagem ou um estado de carregamento.
  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-lg text-gray-600">Nenhum item de serviço encontrado.</p>
        <div className="mt-4">
          <button onClick={onPrev} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg mr-2">Voltar</button>
        </div>
      </div>
    );
  }

    const handleConfirm = () => {
    onNext();
  };


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
          {itens.map((item, index) => (
          <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
        </ul>
      </div>

      <div className="flex justify-between items-center mt-6">
        
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

export default TecServiceSummary;