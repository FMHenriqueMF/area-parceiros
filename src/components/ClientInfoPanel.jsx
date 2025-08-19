// src/components/ClientInfoPanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

function ClientInfoPanel({ cliente, onClose }) {
  if (!cliente) return null;

  return (
    <div className="absolute top-4 right-4 z-10 w-full max-w-sm bg-gray-800 text-white rounded-lg shadow-2xl p-6 border border-gray-700 animate-slide-in">
      <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
        <FiX size={24} />
      </button>
      <h2 className="font-bold text-2xl text-brand-blue mb-2">{cliente.ultimos4}</h2>
      <p className="text-gray-300 mb-1">{cliente.endereco_cliente}</p>
      <p className="text-gray-400 text-sm mb-4">{cliente.itens_cliente}</p>
        <p className="text-green-700 text-sm mb-4">{cliente.parceiropercentual}</p>
      <Link
        to={`/cliente/${cliente.id}`}
        className="bg-brand-blue hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition duration-300 inline-block w-full text-center"
      >
        Ver Detalhes do Serviço
      </Link>
    </div>
  );
}

export default ClientInfoPanel;