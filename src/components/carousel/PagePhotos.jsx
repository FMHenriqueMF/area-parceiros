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
      <h4 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <FiCamera size={24} className="text-brand-blue" />
        <span>Fotos do Antes e Depois</span>
      </h4>
      <div className="space-y-6">
        <div>
          <p className="font-bold text-lg mb-2">Fotos do "Antes":</p>
          <PhotoUploader clienteId={clientData.id} onUploadComplete={(urls) => handlePhotosUploaded(urls, 'before')} />
          {beforePhotos.length > 0 && <p className="text-gray-400 mt-2">{beforePhotos.length} fotos salvas.</p>}
        </div>
        <div>
          <p className="font-bold text-lg mb-2">Fotos do "Depois":</p>
          <PhotoUploader clienteId={clientData.id} onUploadComplete={(urls) => handlePhotosUploaded(urls, 'after')} />
          {afterPhotos.length > 0 && <p className="text-gray-400 mt-2">{afterPhotos.length} fotos salvas.</p>}
        </div>
      </div>
      <div className="flex justify-between mt-6">
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

export default PagePhotos;