// src/components/ConfirmationModal.jsx

import React from 'react';
import Lottie from 'lottie-react';
import successAnimation from '../assets/success-animation.json';

function ConfirmationModal({ show, onClose, onNavigate }) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center max-w-sm mx-auto">
        <Lottie 
          animationData={successAnimation} 
          loop={true} // <-- MUDANÇA FEITA AQUI
          style={{ height: 150, width: 150, margin: '0 auto' }}
        />
        
        <h2 className="text-2xl font-bold text-white mt-4">Serviço Aceito!</h2>
        <p className="text-gray-400 mt-2 mb-6">O cliente foi adicionado à sua lista em "Meus Serviços". O que você deseja fazer agora?</p>

        <div className="flex flex-col space-y-4">
          <button
            onClick={onNavigate}
            className="w-full bg-brand-blue hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
          >
            Ir para Meus Serviços
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
          >
            Continuar no Mural
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;