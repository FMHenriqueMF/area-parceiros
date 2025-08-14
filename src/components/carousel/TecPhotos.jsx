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
    const [extraInfo, setExtraInfo] = useState(clientData.RelatotecnicoItens || '');
      const [actionLoading, setActionLoading] = useState(false);
    


  const handleFinalizeService = async () => {
      setActionLoading(true);
  
      try {

        const clientRef = doc(db, 'clientes', clientData.id);
        await updateDoc(clientRef, {
          RelatotecnicoItens: extraInfo,
        });
  

        logUserActivity(currentUser.uid, 'enviou_foto_e_relatorio', { clienteId: clientData.id });
  
      } catch (error) {
        console.error("Erro ao finalizar o atendimento:", error);
        toast.error(`Não foi possível finalizar o atendimento. Erro: ${error.message}`);
      } finally {
        setActionLoading(false);
        onNext()
      }
    };

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
          
          <PhotoUploader clienteId={clientData.id} onUploadComplete={(urls) => handlePhotosUploaded(urls, 'after')} />
          {afterPhotos.length > 0 && <p className="text-gray-400 mt-2 text-center">{afterPhotos.length} fotos salvas.</p>}
        <div className="flex justify-between mt-12"></div>
        </div>
      </div>
              <div>
          <p className="block text-gray-400 text-sm font-bold mb-2">Relatório Técnico</p>
          <textarea
            value={extraInfo}
            onChange={(e) => setExtraInfo(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
            placeholder="Adicione um relatório detalhado do serviço realizado..."
            rows={4}
          />
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
          
                    onClick={handleFinalizeService}

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