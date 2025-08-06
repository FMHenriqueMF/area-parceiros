// src/components/ConfirmationModal.jsx

import React from 'react';
import Lottie from 'lottie-react';
import successAnimation from '../assets/success-animation.json';
import paymentAnimation from '../assets/payment-animation.json';

import { FiGrid, FiClipboard } from 'react-icons/fi';


function ConfirmationModal({ show, onClose, onNavigate, title, message,animation  }) {
  if (!show) {
    return null;
  }

  return (
    // Fundo semi-transparente que cobre a tela
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      
      {/* O card do modal */}
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 text-center max-w-sm mx-auto border border-gray-700 animate-fade-in">
        
        {/* Animação do Lottie */}
        <Lottie 
          animationData={animation} 
          loop={true}
          style={{ height: 120, width: 120, margin: '0 auto' }}
        />
        
        <h2 className="text-2xl font-bold text-white mt-4">{title}</h2>
        <p className="text-gray-400 mt-2 mb-6">{message}</p>

        <div className="flex flex-col space-y-3">
          <button
            onClick={onNavigate}
            className="w-full bg-brand-blue hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          >
            <FiClipboard />
            Ir para Meus Serviços
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          >
            <FiGrid />
            Continuar na Lista de Clientes
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;