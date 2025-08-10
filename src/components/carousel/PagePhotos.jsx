// src/components/carousel/PagePhotos.jsx

import React, { useState } from 'react';
import { FiCamera, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import PhotoUploader from '../PhotoUploader';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { logUserActivity } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const PagePhotos = ({ clientData, onNext, onPrev }) => {
  const { currentUser } = useAuth();
  const [beforePhotos, setBeforePhotos] = useState(clientData.fotos_antes || []);
  const [afterPhotos, setAfterPhotos] = useState(clientData.fotos_depois || []);

  // Condição para habilitar o botão "Próximo"
  const isNextButtonDisabled = afterPhotos.length < 2;

  const handlePhotosUploaded = async (imageUrls, photoType) => {
    if (!imageUrls || imageUrls.length === 0) return;
    try {
      const clientRef = doc(db, "clientes", clientData.id);
      const updatePayload = photoType === 'before' ? { fotos_antes: arrayUnion(...imageUrls) } : { fotos_depois: arrayUnion(...imageUrls) };
      await updateDoc(clientRef, updatePayload);
      if (photoType === 'before') {
        setBeforePhotos(prev => [...prev, ...imageUrls]);
      } else {
        setAfterPhotos(prev => [...prev, ...imageUrls]);
      }
      toast.success('Fotos enviadas com sucesso!');
      logUserActivity(currentUser.uid, 'FOTOS_ENVIADAS', { clienteId: clientData.id, photoCount: imageUrls.length, photoType });
    } catch (error) {
      console.error("Erro ao salvar URLs das fotos:", error);
      toast.error('Ocorreu um erro ao salvar as fotos.');
    }
  };

  return (
    <div>
      <div className="flex justify-between mt-12"></div>
      <h4 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <FiCamera size={24} className="text-brand-blue" />
        <span>Fotos do Antes e Depois</span>
      </h4>
      <div className="space-y-6">
        <div>
          <h5 className="text-lg font-semibold text-gray-300 mb-2">Fotos do Depois</h5>
          <PhotoUploader clienteId={clientData.id} onUploadComplete={(urls) => handlePhotosUploaded(urls, 'after')} />
          {afterPhotos.length > 0 && <p className="text-gray-400 mt-2 text-center">{afterPhotos.length} fotos salvas.</p>}
        </div>
      </div>
      <div className="flex justify-between mt-12 flex-col items-center">
        {/* Mensagem de aviso em amarelo */}
        {isNextButtonDisabled && (
          <p className="text-yellow-400 text-center text-sm mb-4">
            Você precisa enviar pelo menos 2 fotos para prosseguir.
          </p>
        )}
        <div className="flex justify-between w-full space-x-4">
          <button
            onClick={onPrev}
            className="flex items-center space-x-2 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:bg-gray-500"
          >
            <FiArrowLeft size={20} />
            <span>Voltar</span>
          </button>
          <button
            onClick={onNext}
            disabled={isNextButtonDisabled}
            className={`flex items-center space-x-2 font-bold py-3 px-6 rounded-lg transition duration-300 ${
              isNextButtonDisabled 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-brand-blue text-white hover:bg-blue-600'
            }`}
          >
            <span>Próximo</span>
            <FiArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PagePhotos;