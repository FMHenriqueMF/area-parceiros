// src/components/carousel/TecPayment.jsx

import React, { useState } from 'react';
import { FiDollarSign, FiArrowLeft, FiCamera, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase'; // Verifique se 'storage' está sendo exportado do firebase.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logUserActivity } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

const TecPayment = ({ clientData, onPrev }) => {
  const { currentUser } = useAuth();
  const [extraInfo, setExtraInfo] = useState(clientData.RelatotecnicoItens || '');
  const [serviceValue, setServiceValue] = useState(clientData.valor_totalNUM || '');
  const [paymentMethod, setPaymentMethod] = useState(clientData.forma_pagamento || '');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePhotoUpload = (e) => {
    if (e.target.files[0]) {
      setProofPhoto(e.target.files[0]);
    }
  };

  const handleFinalizeService = async () => {
    setActionLoading(true);
    let photoURL = null;

    try {
      if (proofPhoto) {
        const photoRef = ref(storage, `comprovantes/${clientData.id}/${proofPhoto.name}`);
        await uploadBytes(photoRef, proofPhoto);
        photoURL = await getDownloadURL(photoRef);
      }

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
          <label htmlFor="proofPhotoInput" className="flex items-center space-x-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">
            <FiCamera size={20} />
            <span>{proofPhoto ? 'Foto Selecionada!' : 'Enviar Foto do Comprovante'}</span>
            <input
              id="proofPhotoInput"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
          {proofPhoto && (
            <p className="mt-2 text-sm text-green-400">
              <FiCheckCircle className="inline mr-2" />
              {proofPhoto.name}
            </p>
          )}
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
  );
};

export default TecPayment;