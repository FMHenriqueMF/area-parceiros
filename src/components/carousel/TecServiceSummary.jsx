import React from 'react';

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

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Resumo dos Serviços</h2>
      <ul className="space-y-2 mb-6">
        {itens.map((item, index) => (
          <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
        
        <button 
          onClick={onNext} 
          className="px-20 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition ease-in-out duration-150"
        >
          Próximo
        </button>
    </div>
  );
};

export default TecServiceSummary;