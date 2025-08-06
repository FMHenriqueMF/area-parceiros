import React from 'react';
import { FiXCircle } from 'react-icons/fi';

const SimpleAlertModal = ({ show, onClose, title, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 relative border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
        >
          <FiXCircle size={24} />
        </button>
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300">{message}</p>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleAlertModal;