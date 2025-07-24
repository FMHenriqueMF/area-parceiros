// src/components/ActionConfirmationModal.jsx

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

function ActionConfirmationModal({
  show,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
  confirmText = 'Confirmar',
  confirmButtonClass = 'bg-green-600 hover:bg-green-700'
}) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 text-center max-w-sm mx-auto border border-gray-700 animate-fade-in">
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
            className={`text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 flex items-center justify-center min-w-[120px] ${confirmButtonClass}`}
          >
            {isLoading ? <LoadingSpinner /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionConfirmationModal;