// src/components/carousel/TecPhotos.jsx

import React, { useState } from 'react';
import { FiCamera, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import PhotoUploader from '../PhotoUploader';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { logUserActivity } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const TecPhotos = ({ clientData, onNext, onPrev }) => {
  const { currentUser } = useAuth();
  const [beforePhotos, setBeforePhotos] = useState(clientData.fotos_antes || []);
  const [afterPhotos, setAfterPhotos] = useState(clientData.fotos_depois || []);

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
    <div className="p-6 bg-gray-900 text-white min-h-screen flex flex-col">
      <h4 className="text-2xl font-bold mb-6 flex items-center space-x-3 text-brand-blue">
        <FiCamera size={30} />
        <span>Fotos do Antes e Depois</span>
      </h4>
      
      <div className="flex-grow space-y-8">
        {/* Bloco para fotos do ANTES */}
        <div>
          <label className="block text-gray-400 text-lg font-bold mb-2">Fotos do Antes</label>
          <PhotoUploader 
            clienteId={clientData.id} 
            photoType="before"
            onUploadComplete={(urls) => handlePhotosUploaded(urls, 'before')} 
          />
          {beforePhotos.length > 0 && (
            <p className="text-gray-400 mt-2 text-center">
              {beforePhotos.length} fotos salvas.
            </p>
          )}
        </div>

        {/* Bloco para fotos do DEPOIS */}
        <div>
          <label className="block text-gray-400 text-lg font-bold mb-2">Fotos do Depois</label>
          <PhotoUploader 
            clienteId={clientData.id} 
            photoType="after"
            onUploadComplete={(urls) => handlePhotosUploaded(urls, 'after')} 
          />
          {afterPhotos.length > 0 && (
            <p className="text-gray-400 mt-2 text-center">
              {afterPhotos.length} fotos salvas.
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-12">
        <button
          onClick={onPrev}
          className="flex items-center space-x-2 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:bg-gray-500"
        >
          <FiArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <button
          onClick={onNext}
          className="flex items-center space-x-2 bg-brand-blue text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:bg-blue-600"
        >
          <span>Próximo</span>
          <FiArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default TecPhotos;