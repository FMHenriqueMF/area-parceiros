// src/components/carousel/TecPayment.jsx

import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiArrowLeft, FiSend, FiCheckCircle, FiPlusCircle, FiLock, FiUnlock, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { logUserActivity } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import { atualizarPontuacaoSemanalDoUsuario } from '../../utils/scoreMetasManager';

const COMMON_PAYMENT_METHODS = ['PIX', 'Crédito', 'Débito', 'Dinheiro', 'Pagamento Longe'];
const API_URL = 'https://hook.us2.make.com/e8kovzu0ffyysb93elbcp1nwgncjk4jy';

// Funções auxiliares para simplificar a lógica
const isVerificationRequired = (method) => {
  return method && !['Dinheiro', 'Pagamento Longe'].includes(method);
};

const isRemoteOrCashPayment = (method) => {
    return method === 'Dinheiro' || method === 'Pagamento Longe';
};

const TecPayment = ({ clientData, onPrev }) => {
  const { currentUser } = useAuth();
  
  const [payments, setPayments] = useState([
    {
      value: clientData.valor_totalNUM || '',
      method: clientData.forma_pagamento || '',
      verificationId: '',
      isVerified: false,
      isVerificationLoading: false,
      isLocked: false,
      errorMessage: '',
    },
  ]);
  
  const [totalEntered, setTotalEntered] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

  // Efeito para calcular o total sempre que os pagamentos mudam
  useEffect(() => {
    const total = payments.reduce((acc, payment) => acc + Number(payment.value || 0), 0);
    setTotalEntered(total);
  }, [payments]);

  // Efeito para ouvir mudanças no cliente em tempo real (ex: autorizações da base)
  useEffect(() => {
    if (!clientData.id) return;

    const clientRef = doc(db, 'clientes', clientData.id);
    const unsubscribe = onSnapshot(clientRef, (doc) => {
      if (doc.exists()) {
        const updatedClientData = doc.data();
        
        // Lógica para verificar pagamentos que estavam pendentes
        setPayments(prevPayments => {
            return prevPayments.map(payment => {
                if (payment.isVerificationLoading) {
                    const valorPagoFirebase = Number(updatedClientData.valorpago);
                    const valorDigitado = Number(payment.value);

                    if (valorPagoFirebase && valorPagoFirebase === valorDigitado) {
                        return {
                            ...payment,
                            isVerified: true,
                            isLocked: true,
                            isVerificationLoading: false,
                            errorMessage: '',
                        };
                    }
                }
                return payment;
            });
        });
      }
    });

    // Limpa o listener quando o componente é desmontado
    return () => unsubscribe();
  }, [clientData.id]);


  const handleAddPayment = () => {
    setPayments([...payments, {
      value: '', method: '', verificationId: '', isVerified: false,
      isVerificationLoading: false, isLocked: false, errorMessage: '',
    }]);
  };

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    newPayments[index].errorMessage = '';
    setPayments(newPayments);
  };
  
  const handleVerifyPayment = async (index) => {
    const newPayments = [...payments];
    const paymentToVerify = newPayments[index];

    if (!paymentToVerify.verificationId || !paymentToVerify.value) {
        paymentToVerify.errorMessage = "Preencha o valor e o ID para verificar.";
        setPayments([...newPayments]);
        return;
    }
    
    paymentToVerify.isVerificationLoading = true;
    paymentToVerify.errorMessage = '';
    setPayments([...newPayments]);

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payment_id: paymentToVerify.verificationId,
                external_reference: clientData.id 
            }),
        });
        
        toast.info("Verificação iniciada. Aguardando confirmação...");

        setTimeout(() => {
            setPayments(currentPayments => {
                const p = currentPayments[index];
                if (p && p.isVerificationLoading) {
                    const updatedPayments = [...currentPayments];
                    updatedPayments[index] = {
                        ...p,
                        isVerificationLoading: false,
                        errorMessage: "A verificação está a demorar. Tente novamente ou verifique mais tarde."
                    };
                    return updatedPayments;
                }
                return currentPayments;
            });
        }, 25000);

    } catch (error) {
        console.error("Erro ao iniciar a verificação do pagamento:", error);
        const updatedPayments = [...payments];
        updatedPayments[index].isVerificationLoading = false;
        updatedPayments[index].errorMessage = `Erro ao iniciar a verificação. Tente novamente.`;
        setPayments(updatedPayments);
    }
  };

  const handleFinalizeService = async () => {
    setActionLoading(true);
    setErrorMessages([]);
    let validationErrors = [];

    // Verificação de autorização UNIFICADA para "Pagamento Longe" e "Dinheiro"
    const isBaseApproved = clientData.status_pagamento === 'approved';

    for (const payment of payments) {
        if (!payment.value || !payment.method) {
            validationErrors.push(`Preencha todos os campos de pagamento antes de finalizar.`);
            break;
        }

        if (isRemoteOrCashPayment(payment.method) && !isBaseApproved) {
            validationErrors.push(`Aguardando autorização da base para o pagamento em "${payment.method}".`);
        }

        if (isVerificationRequired(payment.method) && !payment.isVerified) {
            validationErrors.push(`Verifique todos os pagamentos (PIX, Crédito, etc.) antes de finalizar.`);
        }
    }

    if (validationErrors.length > 0) {
        setErrorMessages(validationErrors);
        setActionLoading(false);
        return;
    }
    
    try {
        const hasRemoteOrCash = payments.some(p => isRemoteOrCashPayment(p.method));
        let pontoDoServico;

        // CÁLCULO CONDICIONAL DOS PONTOS
        if (hasRemoteOrCash) {
            // Se for dinheiro ou longe, usa o valor original do cliente para calcular os pontos
            pontoDoServico = Math.ceil((clientData.valor_totalNUM || 0) / 10) * 10;
        } else {
            // Senão, usa o valor total digitado pelo técnico
            pontoDoServico = Math.ceil(totalEntered / 10) * 10;
        }

        const clientRef = doc(db, 'clientes', clientData.id);
        
        const dataToUpdate = {
            ponto: pontoDoServico,
            forma_pagamento: payments.map(p => p.method).join(', '),
            status: 'finalizado'
        };

        // ATUALIZAÇÃO CONDICIONAL: Só atualiza o valor se não houver pagamento em dinheiro ou longe
        if (!hasRemoteOrCash) {
            dataToUpdate.valor_totalNUM = totalEntered;
        }
        
        await updateDoc(clientRef, dataToUpdate);

        await atualizarPontuacaoSemanalDoUsuario(currentUser.uid);
        logUserActivity(currentUser.uid, 'FINALIZOU_ATENDIMENTO', { clienteId: clientData.id });
        toast.success('Atendimento finalizado com sucesso!');

    } catch (error) {
        console.error("Erro ao finalizar o atendimento:", error);
        setErrorMessages([`Não foi possível finalizar o atendimento. Erro: ${error.message}`]);
        toast.error("Erro ao finalizar o atendimento.");
    } finally {
        setActionLoading(false);
    }
  };

  const isBaseApproved = clientData.status_pagamento === 'approved';

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen flex flex-col">
      <h4 className="text-2xl font-bold mb-6 flex items-center space-x-3 text-brand-blue">
        <FiDollarSign size={30} />
        <span>Finalizar Atendimento</span>
      </h4>

      <div className="flex-grow space-y-6">
        {payments.map((payment, index) => {
            const isLocked = payment.isLocked || (isRemoteOrCashPayment(payment.method) && isBaseApproved);
            const isValueDisabled = payment.isLocked || payment.isVerificationLoading || isRemoteOrCashPayment(payment.method);

            return (
              <div key={index} className="space-y-4 border-b border-gray-700 pb-4 last:border-b-0">
                <h5 className="text-lg font-bold text-gray-400">Pagamento #{index + 1}</h5>
                
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2">Valor (R$)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={payment.value}
                      onChange={(e) => handlePaymentChange(index, 'value', e.target.value)}
                      className={`w-full p-3 rounded-lg bg-gray-800 border ${payment.errorMessage ? 'border-red-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 focus:ring-brand-blue`}
                      placeholder="Ex: 150.50"
                      disabled={isValueDisabled}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isLocked ? <FiLock size={20} className="text-green-500" /> : <FiUnlock size={20} className="text-gray-500" />}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2">Forma de Pagamento</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_PAYMENT_METHODS.map((method) => (
                      <button
                        key={method}
                        onClick={() => handlePaymentChange(index, 'method', method)}
                        disabled={payment.isLocked}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          payment.method === method
                            ? 'bg-brand-blue text-white shadow-lg'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
                
                {(payment.method === 'Dinheiro' || payment.method === 'Pagamento Longe') && (
                  <div className={`mt-4 p-4 rounded-lg border ${isBaseApproved ? 'bg-green-900 border-green-700' : 'bg-yellow-900 border-yellow-700'}`}>
                    <div className={`flex items-center ${isBaseApproved ? 'text-green-300' : 'text-yellow-300'}`}>
                      {isBaseApproved ? <FiCheckCircle className="mr-3 flex-shrink-0" size={24} /> : <FiAlertCircle className="mr-3 flex-shrink-0" size={24} />}
                      <div>
                        <h6 className="font-bold">{isBaseApproved ? 'Pagamento Autorizado!' : 'Aguardando Autorização da Base'}</h6>
                        <p className="text-xs">{isBaseApproved ? 'Pode finalizar o atendimento.' : `A base precisa autorizar o pagamento em ${payment.method}.`}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {isVerificationRequired(payment.method) && (
                  <div className="space-y-2">
                    <label className="block text-gray-400 text-sm font-bold">ID de Verificação</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={payment.verificationId}
                        onChange={(e) => handlePaymentChange(index, 'verificationId', e.target.value)}
                        className="flex-grow p-3 rounded-lg bg-gray-800 border border-gray-600 text-white"
                        placeholder="Cole o ID de pagamento aqui..."
                        disabled={payment.isLocked || payment.isVerificationLoading}
                      />
                      <button
                        onClick={() => handleVerifyPayment(index)}
                        className={`flex items-center justify-center p-3 rounded-lg transition duration-300 ${payment.isVerified ? 'bg-green-600' : 'bg-brand-blue hover:bg-blue-600'} text-white font-bold disabled:bg-gray-500`}
                        disabled={payment.isLocked || payment.isVerificationLoading}
                      >
                        {payment.isVerificationLoading ? <LoadingSpinner /> : (payment.isVerified ? <FiCheckCircle size={20} /> : <FiSend size={20} />)}
                      </button>
                    </div>
                    {payment.errorMessage && <p className="text-red-500 text-xs mt-1">{payment.errorMessage}</p>}
                  </div>
                )}
              </div>
            )
        })}
        
        <button
          onClick={handleAddPayment}
          className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg transition duration-300 bg-gray-700 hover:bg-gray-600 text-white font-bold"
        >
          <FiPlusCircle size={20} />
          <span>Adicionar Outra Forma de Pagamento</span>
        </button>
      </div>

      <div className="my-4 p-4 bg-gray-800 rounded-lg text-center">
        <span className="text-gray-400 font-semibold">Valor Total Inserido: </span>
        <span className="text-white font-bold text-xl">
          {totalEntered.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      {errorMessages.length > 0 && (
        <div className="my-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-300 space-y-1">
          {errorMessages.map((error, index) => (
            <p key={index} className="text-sm font-semibold">{error}</p>
          ))}
        </div>
      )}

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
          disabled={actionLoading || payments.some(p => p.isVerificationLoading)}
        >
          {actionLoading ? <LoadingSpinner /> : <FiCheckCircle size={20} />}
          <span>Finalizar Atendimento</span>
        </button>
      </div>
    </div>
  );
};

export default TecPayment;
