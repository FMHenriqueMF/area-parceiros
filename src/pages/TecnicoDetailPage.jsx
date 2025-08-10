// src/pages/ClientDetailPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react'; // Adicionado useCallback
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, getDocs, query, where, orderBy, runTransaction, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import ActionConfirmationModal from '../components/ActionConfirmationModal.jsx';
import SimpleAlertModal from '../components/SimpleAlertModal.jsx';
import successAnimation from '../assets/success-animation.json';
import paymentAnimation from '../assets/payment-animation.json';
import { logUserActivity } from '../utils/logger.js';
import { getPartnerPermissions } from '../utils/permissions.js';
import { addReliabilityEvent } from '../utils/scoreManager.js';
import { toast } from 'react-toastify';
import TecnicoCarousel from '../components/TecnicoCarousel';
import { MdOutlineCalendarToday, MdOutlineLocationOn, MdFormatListBulleted, MdInfoOutline, MdAttachMoney } from 'react-icons/md';
import { getDoc } from 'firebase/firestore';

const CHECKLIST_STEPS = {
    START: 'start',
    CONFIRM_SERVICE: 'confirm_service',
    BEFORE_PHOTOS: 'before_photos',
    AFTER_PHOTOS: 'after_photos',
    ADD_EXTRA_INFO: 'add_extra_info',
    SEND_PAYMENT: 'send_payment',
};

const getTurnoByHora = (hora) => {
    if (!hora) return null;
    const [hour, minute] = hora.split(':').map(Number);
    const fullTime = hour + minute / 60;
    if (fullTime >= 6 && fullTime < 12) return 'Manhã';
    if (fullTime >= 12 && fullTime < 19) return 'Tarde';
    return null;
};


function TecnicoDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [cliente, setCliente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [extraInfo, setExtraInfo] = useState('');
    const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
    const [checklistStep, setChecklistStep] = useState(CHECKLIST_STEPS.START);
    const [showAlert, setShowAlert] = useState({ show: false, title: '', message: '' });
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
    const [carouselStep, setCarouselStep] = useState(0);
    const [isEditingItems, setIsEditingItems] = useState(false);
    const [newItems, setNewItems] = useState([]);
    const [newTotalPrice, setNewTotalPrice] = useState(0);

    const isOwner = currentUser && cliente && currentUser.uid === cliente.aceito_por_uid;

    const timerRef = useRef(null);

    const handleItemsChange = useCallback((items, price) => {
        setNewItems(items);
        setNewTotalPrice(price);
    }, []);

    useEffect(() => {
        if (isOwner && isDetailsExpanded && cliente?.status === 'teccheguei') {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                setIsDetailsExpanded(false);
            }, 1500);
        }
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isDetailsExpanded, cliente, isOwner]);

    useEffect(() => {
        if (!id || !currentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const docRef = doc(db, 'clientes', id);
        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                const clientData = { id: docSnap.id, ...docSnap.data() };

                if (!clientData.turno && clientData.hora) {
                    clientData.turno = getTurnoByHora(clientData.hora);
                }

                setCliente(clientData);
                setExtraInfo(clientData.RelatotecnicoItens || '');
                setNewItems(clientData.itens_cliente);
                setNewTotalPrice(clientData.parceiropercentual);

                if (clientData.status === 'finalizado') {
                    if (!clientData.nota_atualizada) {
                        await addReliabilityEvent(db, currentUser.uid, 10.0);
                        const clientRef = doc(db, 'clientes', id);
                        await updateDoc(clientRef, { nota_atualizada: true });
                    }
                    setShowPaymentSuccessModal(true);
                    setChecklistStep(null);
                } else if (clientData.status !== 'aguardandopagamento') {
                    if (clientData.status === 'teccheguei') {
                        const checklistStepsOrder = ['servico_confirmado', 'fotos_antes', 'fotos_depois', 'RelatotecnicoItens'];
                        const currentStepIndex = checklistStepsOrder.findIndex(key => !clientData[key]);
                        if (currentStepIndex !== -1) {
                            const newStep = [CHECKLIST_STEPS.CONFIRM_SERVICE, CHECKLIST_STEPS.BEFORE_PHOTOS, CHECKLIST_STEPS.AFTER_PHOTOS, CHECKLIST_STEPS.ADD_EXTRA_INFO][currentStepIndex];
                            setChecklistStep(newStep);
                        } else {
                            setChecklistStep(CHECKLIST_STEPS.SEND_PAYMENT);
                        }
                    } else {
                        setChecklistStep(CHECKLIST_STEPS.START);
                    }
                } else if (clientData.status === 'aguardandopagamento') {
                    setChecklistStep(null);
                }

                // >>>>>>>>>>>>>>>>>> LÓGICA DE PERMISSÃO UNIFICADA <<<<<<<<<<<<<<<<<<<<

            } else {
                setCliente(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Erro ao escutar o cliente:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, currentUser, navigate, db]); // Adicionado 'db'


    const handleClaimJob = async () => {
        setActionLoading(true);
        setActionError('');

        try {
            const clientRef = doc(db, "clientes", id);
            await runTransaction(db, async (transaction) => {
                const clientDoc = await transaction.get(clientRef);

                transaction.update(clientRef, {
                    status: 'tecdeslocamento',
                    aceito_por: currentUser.nome_empresa,
                    aceito_por_uid: currentUser.uid,
                    aceito_em: serverTimestamp()
                });
            });
            await logUserActivity(currentUser.uid, 'SERVICO_ACEITO', { clienteId: id, clienteNome: cliente?.quem_recebe });
        } catch (error) {
            setActionError(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleArrived = async () => {
        setActionLoading(true);
        setActionError('');
        try {
            const clientRef = doc(db, "clientes", id);
            await updateDoc(clientRef, { status: 'teccheguei' });
            await logUserActivity(currentUser.uid, 'CHEGOU_AO_LOCAL', { clienteId: id, clienteNome: cliente?.quem_recebe });
        } catch (error) {
            console.error("Erro ao marcar chegada:", error);
            setActionError("Não foi possível atualizar o status. Tente novamente.");
        } finally {
            setActionLoading(false);
        }
    };




    if (loading) return <div className="text-white text-center p-10">Carregando detalhes do cliente...</div>;
    if (!cliente) return <div className="text-white text-center p-10">Cliente não encontrado.</div>;



    let itensArray = [];
    if (Array.isArray(cliente?.itens_cliente)) {
        itensArray = cliente.itens_cliente.filter(item => item && item.trim() !== '');
    } else if (typeof cliente?.itens_cliente === 'string' && cliente.itens_cliente.trim() !== '') {
        itensArray = [cliente.itens_cliente];
    }

    return (
        <>
            <div className="bg-gray-900 min-h-screen p-4 sm:p-8 text-white">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <Link to={isOwner ? "/agenda" : "/agenda"} className="text-blue-400 hover:text-blue-300">
                            &larr; Voltar
                        </Link>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div
                            className={`bg-gray-800 p-8 rounded-lg shadow-xl transition-all duration-500 ease-in-out cursor-pointer hover:bg-gray-800 ${isDetailsExpanded ? 'md:col-span-2' : 'md:col-span-1'}`}
                            onClick={() => setIsDetailsExpanded(cliente.status == "teccheguei" ? !isDetailsExpanded : isDetailsExpanded)}
                        >
                            <h2 className="text-3xl font-bold mb-6 border-b border-gray-800 pb-4">{isDetailsExpanded ? 'Detalhes do Agendamento' : "Clique para acessar os Detalhes"}</h2>

                            <div className={`transition-all duration-200 ease-in-out overflow-hidden ${isDetailsExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-6">
                                    <h1 className="text-3xl font-bold text-brand-blue truncate">OS - {cliente.ultimos4}</h1>
                                        <p className="text-lg text-white">{cliente?.quem_recebe}</p>
                                        <p className="text-lg text-white">{cliente?.quem_recebe}</p>
                                    <div className="flex items-start">
                                        <MdOutlineCalendarToday className="mr-4 text-3xl text-brand-blue flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-300 text-xl font-medium">{`${cliente?.data} - ${cliente?.hora || cliente?.turno}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <MdOutlineLocationOn className="mr-4 text-3xl text-brand-blue flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-300 text-lg font-medium">{`${cliente?.endereco_cliente}, ${cliente?.bairro}, ${cliente?.cidade} - ${cliente?.Estado}`}</p>

                                            <p className="text-white text-sm mt-1">{`Complemento: ${cliente?.complemento_endereco}`}</p>


                                        </div>
                                    </div>

                                    <hr className="border-gray-800 my-4" />

                                    {itensArray.length > 0 && (
                                        <div className="flex items-start">
                                            <MdFormatListBulleted className="mr-4 text-3xl text-brand-blue flex-shrink-0" />
                                            <div className="flex-1 space-y-1">
                                                {itensArray.map((item, index) => (
                                                    <p key={index} className="text-gray-200 text-lg">{item}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {cliente?.observacoesAdicionaisCliente  && (
                                        <div className="flex items-start">
                                            <MdInfoOutline className="mr-4 text-3xl text-brand-blue flex-shrink-0" />
                                            <p className="text-gray-300 text-lg whitespace-pre-wrap">{cliente?.observacoesAdicionaisCliente}</p>                      </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
    className={`bg-gray-800 p-3 rounded-lg shadow-xl transition-all duration-500 ease-in-out ${isDetailsExpanded ? 'md:col-span-1' : 'md:col-span-2'}`}
                        >
                                <p className="text-yellow-500 text-sm italic"> </p>

                            {isOwner && (cliente?.status === 'teccheguei') && (
                                <TecnicoCarousel
                                    step={carouselStep}
                                    clientData={cliente}
                                    onNext={() => setCarouselStep(prev => prev + 1)}
                                    onPrev={() => setCarouselStep(prev => prev - 1)}
                                    onFinish={() => setChecklistStep(null)}
                                />
                            )}
                            {cliente?.status === 'disponivel' && (
                                <>
                                    <button
                                        onClick={handleClaimJob}
                                        disabled={actionLoading}
                                        className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                                        {actionLoading ? <LoadingSpinner /> : 'Iniciar o deslocamento'}
                                    </button>
                                </>
                            )}

                            {isOwner && cliente?.status === 'tecdeslocamento' && (
                                <button onClick={handleArrived} disabled={actionLoading} className="w-full max-w-sm mx-auto bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                                    {actionLoading ? <LoadingSpinner /> : 'Cheguei ao Local'}
                                </button>
                            )}
                            {isOwner && cliente?.status === 'tecaguardandopagamento' && (
                                <div className="p-4 bg-gray-800 rounded-lg text-center">
                                    <p className="font-bold text-lg text-yellow-500">Aguardando pagamento do cliente...</p>
                                    <p className="text-sm text-gray-400 mt-2">O link já foi enviado. Não é necessário fazer mais nada no momento.</p>
                                </div>
                            )}
                            {isOwner && cliente?.status === 'finalizado' && (
                                <div className="p-4 bg-gray-800 rounded-lg text-center">
                                    <p className="font-bold text-lg text-go-green">Serviço Finalizado!</p>
                                    <p className="text-sm text-gray-400 mt-2">Este serviço foi concluído com sucesso.</p>
                                </div>
                            )}
                            {isOwner && ['aceito'].includes(cliente?.status) && (
                                <div className="text-center mt-4">
                                </div>
                            )}
                            {actionError && <p className="text-red-500 mt-4">{actionError}</p>}
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal show={showConfirmation} onClose={() => { setShowConfirmation(false); navigate('/agenda'); }} onNavigate={() => { setShowConfirmation(false); navigate('/agenda'); }} title="Serviço Aceito!" message="Você aceitou este serviço. Ele foi adicionado à sua lista de serviços ativos." animation={successAnimation} />
            <ConfirmationModal show={showPaymentSuccessModal} onClose={() => setShowPaymentSuccessModal(false)} onNavigate={() => navigate('/agenda')} title="Pagamento Confirmado!" message="O pagamento do cliente foi confirmado. O serviço foi finalizado com sucesso." animation={paymentAnimation} />
            {showAlert.show && (<SimpleAlertModal title={showAlert.title} message={showAlert.message} onClose={() => setShowAlert({ ...showAlert, show: false })} />)}
        </>
    );
}

export default TecnicoDetailPage;