// src/components/carousel/TecPayment.jsx

import React, { useState } from 'react';
import { FiDollarSign, FiArrowLeft, FiCamera,FiSend, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { doc, updateDoc } from 'firebase/firestore';
import { db} from '../../firebase'; 
import { logUserActivity } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import PhotoUploader from '../PhotoUploader';


const TecPayment = ({ clientData, onPrev }) => {
  const { currentUser } = useAuth();
  const [extraInfo, setExtraInfo] = useState(clientData.RelatotecnicoItens || '');
  const [serviceValue, setServiceValue] = useState(clientData.valor_totalNUM || '');
  const [paymentMethod, setPaymentMethod] = useState(clientData.forma_pagamento || '');
  const [comprovantePhotos, setPhotos] = useState(clientData.foto_comprovante || []);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePhotosUploaded = async (imageUrls, photoType) => {
    if (!imageUrls || imageUrls.length === 0) return;
    try {
      const clientRef = doc(db, "clientes", clientData.id);
      const updatePayload = photoType === 'before' ? { fotos_antes: arrayUnion(...imageUrls) } : { fotos_depois: arrayUnion(...imageUrls) };
      await updateDoc(clientRef, updatePayload);
      
      setPhotos(prev => [...prev, ...imageUrls]);
      
      toast.success('Fotos enviadas com sucesso!');
      logUserActivity(currentUser.uid, 'FOTOS_ENVIADAS', { clienteId: clientData.id, photoCount: imageUrls.length, photoType });
    } catch (error) {
      console.error("Erro ao salvar URLs das fotos:", error);
      toast.error('Ocorreu um erro ao salvar as fotos.');
    }
  };

  const handleFinalizeService = async () => {
    setActionLoading(true);
    let photoURL = null;

    try {
      

      const clientRef = doc(db, 'clientes', clientData.id);
      await updateDoc(clientRef, {
        RelatotecnicoItens: extraInfo,
        valor_totalNUM: Number(serviceValue),
        forma_pagamento: paymentMethod,
        foto_comprovante: photoURL,
        status: 'finalizado'
      });

      logUserActivity(currentUser.uid, 'FINALIZOU_ATENDIMENTO', { clienteId: clientData.id });
      toast.success('Atendimento finalizado e dados salvos com sucesso!', { position: "bottom-center" });

    } catch (error) {
      console.error("Erro ao finalizar o atendimento:", error);
      toast.error(`Não foi possível finalizar o atendimento. Erro: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen flex flex-col">
      <h4 className="text-2xl font-bold mb-6 flex items-center space-x-3 text-brand-blue">
        <FiDollarSign size={30} />
        <span>Finalizar Atendimento</span>
      </h4>

      <div className="flex-grow space-y-6">
  

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


              <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">Valor do Serviço (apenas números)</label>
          <input
            type="number"
            value={serviceValue}
            onChange={(e) => setServiceValue(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="Ex: 150.50"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">Forma de Pagamento</label>
          <input
            type="text"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="Ex: PIX, Cartão, Dinheiro..."
          />
        </div>

        <div>
          <div className="flex-grow space-y-8">


        {/* Bloco para fotos do DEPOIS */}
        <div>
          <label className="block text-gray-400 text-lg font-bold mb-2">Fotos do Comprovante</label>
          <PhotoUploader 
            clienteId={clientData.id} 
            photoType="comprovante"
            onUploadComplete={(urls) => handlePhotosUploaded(urls, 'comprovante')} 
          />
          {comprovantePhotos.length > 0 && (
            <p className="text-gray-400 mt-2 text-center">
              {comprovantePhotos.length} fotos salvas.
            </p>
          )}
        </div>
      </div>
          
        </div>

      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onPrev}
          className="flex items-center space-x-2 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:bg-gray-500"
          disabled={actionLoading}
        >
          <FiArrowLeft size={20} />
          <span>Voltar</span>
        </button>

        <button
          onClick={handleFinalizeService}
          className="flex items-center space-x-2 bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:bg-green-700 disabled:bg-gray-500"
          disabled={actionLoading}
        >
          {actionLoading ? (
            <>
              <LoadingSpinner />
              <span>Finalizando...</span>
            </>
          ) : (
            <>
              <FiCheckCircle size={20} />
              <span>Finalizar Atendimento</span>
            </>
          )}
        </button>
      </div>
    </div>
          </div>

  );
};

export default TecPayment;