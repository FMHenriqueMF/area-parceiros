// src/components/carousel/PagePayment.jsx

import React, { useState } from 'react';
import { FiDollarSign, FiArrowLeft, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { logUserActivity } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/yt7j57js7auf6qqtnkmtkkwllzqai3zu";

const PagePayment = ({ clientData, onPrev }) => {
  const { currentUser } = useAuth();
  const [extraInfo, setExtraInfo] = useState(clientData.RelatotecnicoItens || '');
  const [actionLoading, setActionLoading] = useState(false);
  const [altPaymentPhone, setAltPaymentPhone] = useState('');
  const [showAltPayment, setShowAltPayment] = useState(false);

  const sendPaymentLink = async (phone) => {
    if (!phone) {
      toast.error("É necessário um número de telefone.");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        nome: clientData?.quem_recebe,
        telefone: phone,
        codigo_cliente: `${clientData.id}-${clientData?.aceito_por_uid}`,
        id_parceiro: clientData?.aceito_por_uid,
        valor: clientData?.parceiropercentual,
      };

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Make: ${response.statusText}`);
      }
      
      console.log(`Link de pagamento enviado para: ${phone} via webhook.`);
      
      const clientRef = doc(db, "clientes", clientData.id);
      await updateDoc(clientRef, { status: 'aguardandopagamento' });
      logUserActivity(currentUser.uid, 'ENVIOU_LINK_PAGAMENTO', { clienteId: clientData.id, telefonePagamento: phone });
      
      toast.success(`Link de pagamento enviado para ${phone} com sucesso!`, { position: "bottom-center" });

    } catch (error) {
      console.error("Erro no envio do pagamento via webhook:", error);
      toast.error(`Ocorreu um erro ao enviar o link de pagamento. Erro: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveExtraInfoAndSendPayment = async () => {
    setActionLoading(true);
    try {
      const clientRef = doc(db, 'clientes', clientData.id);
      await updateDoc(clientRef, { RelatotecnicoItens: extraInfo });
      toast.success('Relatório salvo com sucesso!');
      logUserActivity(currentUser.uid, 'SALVOU_RELATORIO_TECNICO', { clienteId: clientData.id });
      await sendPaymentLink(clientData.telefone_cliente);
    } catch (error) {
      console.error("Erro ao salvar informações extras:", error);
      toast.error("Não foi possível salvar o relatório.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h4 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <FiDollarSign size={24} className="text-brand-blue" />
        <span>Finalizar Atendimento</span>
      </h4>
      <div className="space-y-4">
        <div>
          <p className="font-bold text-lg mb-2">Relatório Técnico:</p>
          <textarea
            value={extraInfo}
            onChange={(e) => setExtraInfo(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
            placeholder="Adicionar relatório técnico do atendimento..."
            rows={3}
          />
        </div>
        {!showAltPayment ? (
          <button
            onClick={handleSaveExtraInfoAndSendPayment}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center"
            disabled={actionLoading}
          >
            {actionLoading ? <LoadingSpinner /> : 'Enviar Link de Pagamento'}
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-lg font-semibold text-white">Outra pessoa realizará o pagamento?</p>
            <div className="relative">
              <input
                type="tel"
                value={altPaymentPhone}
                onChange={(e) => setAltPaymentPhone(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue text-white"
                placeholder="Digite o telefone com DDD"
              />
            </div>
            <button
              onClick={() => sendPaymentLink(altPaymentPhone)}
              disabled={actionLoading || !altPaymentPhone}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {actionLoading ? <LoadingSpinner /> : 'Enviar Link para o número'}
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-start mt-6">
        <button
          onClick={onPrev}
          className="flex items-center space-x-2 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:bg-gray-500"
        >
          <FiArrowLeft size={20} />
          <span>Voltar</span>
        </button>
      </div>
    </div>
  );
};

export default PagePayment;