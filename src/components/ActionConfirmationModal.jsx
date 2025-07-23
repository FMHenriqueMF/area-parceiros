// src/components/ActionConfirmationModal.jsx

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

// Props:
// - show: (boolean) controla a visibilidade
// - onClose: função para o botão "Cancelar"
// - onConfirm: função para o botão "Confirmar"
// - title: o título do modal
// - message: a mensagem de aviso
// - isLoading: (boolean) para mostrar um spinner no botão de confirmar
function ActionConfirmationModal({ show, onClose, onConfirm, title, message, isLoading = false }) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 text-center max-w-sm mx-auto border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
        <p className="text-gray-400 mb-6">{message}</p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? <LoadingSpinner /> : 'Sim, Iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionConfirmationModal;