// src/components/carousel/TecPayment.jsx

import React, { useState, useEffect, useRef } from 'react';
import { FiDollarSign, FiArrowLeft, FiSend, FiCheckCircle, FiPlusCircle, FiLock, FiUnlock, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
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
      retryAttempt: 0,
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
const verificationTimeoutsRef = useRef({});

// useEffect para verificação em tempo real - OTIMIZADO
useEffect(() => {
    if (!clientData.id) return;

    const clientRef = doc(db, 'clientes', clientData.id);
    const unsubscribe = onSnapshot(clientRef, (doc) => {
      if (doc.exists()) {
        const updatedClientData = doc.data();
        
        setPayments(prevPayments => {
            return prevPayments.map((payment, index) => {
                if (payment.isVerificationLoading) {
                    const valorPagoFirebase = Number(updatedClientData.valorpago);
                    const valorDigitado = Number(payment.value);

                    // ✅ VERIFICAÇÃO EXATA - valores devem ser IDÊNTICOS
                    if (valorPagoFirebase && valorPagoFirebase === valorDigitado) {
                        
                        // Limpa o timeout se existir
                        if (verificationTimeoutsRef.current[index]) {
                            clearTimeout(verificationTimeoutsRef.current[index]);
                            delete verificationTimeoutsRef.current[index];
                        }

                        toast.success(`💰 Pagamento #${index + 1} verificado!`);
                        
                        return {
                            ...payment,
                            isVerified: true,
                            isLocked: true,
                            isVerificationLoading: false,
                            errorMessage: '',
                        };
                    }

                    // ✅ Verifica se o Make retornou algum erro específico
                    if (updatedClientData.verification_error) {
                        
                        // Limpa o timeout
                        if (verificationTimeoutsRef.current[index]) {
                            clearTimeout(verificationTimeoutsRef.current[index]);
                            delete verificationTimeoutsRef.current[index];
                        }

                        return {
                            ...payment,
                            isVerificationLoading: false,
                            errorMessage: `❌ ${updatedClientData.verification_error}`,
                        };
                    }
                }
                return payment;
            });
        });
      }
    }, (error) => {
        console.error('❌ Erro no listener do Firebase:', error);
        toast.error('Erro de conexão. Verifique sua internet.');
    });

    return () => {
        unsubscribe();
        // Limpa todos os timeouts ao desmontar
        Object.values(verificationTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
        verificationTimeoutsRef.current = {};
    };
}, [clientData.id]); // ✅ Removido verificationTimeouts das dependências

// Função de verificação otimizada com retry e timeout dinâmico
const makeAPICall = async (payload, attempt = 1, maxRetries = 2) => {
    try {
        const controller = new AbortController();
        const requestTimeout = 8000 + (attempt * 2000); // 8s, 10s, 12s progressivo
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        console.log(`🚀 Tentativa ${attempt}/${maxRetries} - Timeout: ${requestTimeout/1000}s`);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log(`✅ API respondeu na tentativa ${attempt}`);
        return response;
    } catch (error) {
        console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
        
        if (attempt < maxRetries && error.name !== 'AbortError') {
            const delay = 1500 * attempt; // 1.5s, 3s
            console.log(`⏳ Aguardando ${delay/1000}s antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return makeAPICall(payload, attempt + 1, maxRetries);
        }
        throw error;
    }
};

// Nova função: verifica primeiro no Firebase
const checkFirebaseFirst = async (valorEsperado) => {
    try {
        const clientRef = doc(db, 'clientes', clientData.id);
        const clientSnap = await getDoc(clientRef);
        
        if (clientSnap.exists()) {
            const data = clientSnap.data();
            const valorPagoFirebase = Number(data.valorpago);
            console.log(`🔍 Firebase check: valorpago=${valorPagoFirebase}, esperado=${valorEsperado}`);
            
            // Se já tem o valor correto no Firebase, não precisa chamar o Make
            if (valorPagoFirebase && valorPagoFirebase === valorEsperado) {
                return { success: true, found: true };
            }
            
            // Se tem outro valor ou erro de verificação, também não precisa chamar Make
            if (data.verification_error) {
                return { success: false, error: data.verification_error, found: true };
            }
        }
        
        // Não encontrou o valor correto, precisa chamar o Make
        return { success: false, found: false };
    } catch (error) {
        console.error('❌ Erro ao verificar Firebase:', error);
        return { success: false, found: false, error: error.message };
    }
};

const handleVerifyPayment = async (index) => {
    const newPayments = [...payments];
    const paymentToVerify = newPayments[index];

    // Validações iniciais
    if (!paymentToVerify.verificationId?.trim() || !paymentToVerify.value) {
        paymentToVerify.errorMessage = "❌ Preencha o valor e o ID para verificar.";
        setPayments([...newPayments]);
        return;
    }

    // Verifica se já existe uma verificação em andamento
    if (paymentToVerify.isVerificationLoading) {
        return;
    }
    
    paymentToVerify.isVerificationLoading = true;
    paymentToVerify.errorMessage = '';
    setPayments([...newPayments]);

    const valorEsperado = Number(paymentToVerify.value);

    try {
        // 🔥 NOVA LÓGICA: Verifica primeiro no Firebase
        console.log('🔍 Verificando primeiro no Firebase...');
        toast.info("🔍 Verificando no Firebase...");
        
        const firebaseCheck = await checkFirebaseFirst(valorEsperado);
        
        if (firebaseCheck.success) {
            // ✅ Já encontrou no Firebase!
            console.log('✅ Pagamento já verificado no Firebase!');
            toast.success(`💰 Pagamento #${index + 1} já estava verificado!`);
            
            const updatedPayments = [...payments];
            updatedPayments[index] = {
                ...paymentToVerify,
                isVerified: true,
                isLocked: true,
                isVerificationLoading: false,
                errorMessage: '',
            };
            setPayments(updatedPayments);
            return;
        }
        
        if (firebaseCheck.found && firebaseCheck.error) {
            // ❌ Tem erro de verificação no Firebase
            console.log('❌ Erro já registrado no Firebase:', firebaseCheck.error);
            const updatedPayments = [...payments];
            updatedPayments[index] = {
                ...paymentToVerify,
                isVerificationLoading: false,
                errorMessage: `❌ ${firebaseCheck.error}`,
            };
            setPayments(updatedPayments);
            return;
        }

        // 🚀 Só chama o Make se não encontrou no Firebase
        console.log('🚀 Valor não encontrado no Firebase, consultando Make...');
        toast.info("🔄 Consultando Make.com...");
        
        const payload = {
            payment_id: paymentToVerify.verificationId.trim(),
            external_reference: clientData.id,
            valor_esperado: valorEsperado,
            timestamp: new Date().toISOString()
        };

        await makeAPICall(payload);
        toast.info("✅ Make consultado! Aguardando atualização...");

        // ✅ Timeout reduzido já que Make só precisa atualizar o Firebase
        const timeoutId = setTimeout(() => {
            setPayments(currentPayments => {
                const p = currentPayments[index];
                if (p && p.isVerificationLoading) {
                    const updatedPayments = [...currentPayments];
                    updatedPayments[index] = {
                        ...p,
                        isVerificationLoading: false,
                        errorMessage: "⏰ Verifique o valor e tente novamente."
                    };
                    return updatedPayments;
                }
                return currentPayments;
            });
            
            delete verificationTimeoutsRef.current[index];
        }, 20000); // Reduzido para 20 segundos

        // Armazena o timeout no ref
        verificationTimeoutsRef.current[index] = timeoutId;

    } catch (error) {
        console.error("❌ Erro ao verificar pagamento:", error);
        
        let errorMessage = "❌ Erro na verificação. Tente novamente.";
        if (error.name === 'AbortError') {
            errorMessage = "⏰ Timeout na verificação. Verifique sua conexão.";
        } else if (error.message.includes('HTTP')) {
            errorMessage = `❌ Erro do servidor: ${error.message}`;
        }
        
        const updatedPayments = [...payments];
        updatedPayments[index].isVerificationLoading = false;
        updatedPayments[index].errorMessage = errorMessage;
        setPayments(updatedPayments);
        
        toast.error("Falha na verificação. Tente novamente.");
    }
};


  const handleAddPayment = () => {
    setPayments([...payments, {
      value: '', method: '', verificationId: '', isVerified: false,
      isVerificationLoading: false, isLocked: false, errorMessage: '', retryAttempt: 0,
    }]);
  };

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    newPayments[index].errorMessage = '';
    setPayments(newPayments);
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
            status: 'finalizado',
            status_pagamento: 'approved'

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
                        className={`flex items-center justify-center p-3 rounded-lg transition duration-300 min-w-[60px] ${
                          payment.isVerified 
                            ? 'bg-green-600' 
                            : payment.isVerificationLoading 
                              ? 'bg-blue-500' 
                              : 'bg-brand-blue hover:bg-blue-600'
                        } text-white font-bold disabled:bg-gray-500`}
                        disabled={payment.isLocked || payment.isVerificationLoading}
                        title={payment.isVerificationLoading ? 'Verificando com retry automático...' : payment.isVerified ? 'Verificado!' : 'Verificar pagamento'}
                      >
                        {payment.isVerificationLoading ? (
                          <div className="flex flex-col items-center">
                            <LoadingSpinner />
                            <span className="text-xs mt-1">⚡</span>
                          </div>
                        ) : (
                          payment.isVerified ? <FiCheckCircle size={20} /> : <FiSend size={20} />
                        )}
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
