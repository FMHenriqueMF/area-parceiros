// src/pages/DashboardPage.jsx

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../utils/logger';
import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiCalendar, FiAlertTriangle, FiSlash } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';


// Helper to format time with leading zeros (e.g., 09, 08, 07)
const formatTime = (time) => String(time).padStart(2, '0');

// --- Unified Ban Screen Component ---
const BannedScreen = ({ bannedAt, userName, suspensionCount, isPermanentlyBanned }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isAppealable, setIsAppealable] = useState(false);

    useEffect(() => {
        // If permanently banned or no ban timestamp, do nothing.
        if (isPermanentlyBanned || !bannedAt) {
            setIsAppealable(false);
            return;
        }

        const banDate = bannedAt.toDate ? bannedAt.toDate() : new Date(bannedAt);
        const appealDate = new Date(banDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        const timer = setInterval(() => {
            const now = new Date();
            const difference = appealDate.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft({ days, hours, minutes, seconds });
                setIsAppealable(false);
            } else {
                setTimeLeft(null);
                setIsAppealable(true);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [bannedAt, isPermanentlyBanned]);

    const handleAppeal = () => {
        const supportPhoneNumber = '555183315715'; // REPLACE WITH REAL SUPPORT NUMBER
        const message = `Olá, sou o parceiro ${userName}. Fui bloqueado na plataforma e o prazo de 7 dias para solicitar a reavaliação já passou. Gostaria de iniciar o processo para reativar minha conta.`;
        const whatsappUrl = `https://wa.me/${supportPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    // --- UI for Permanent Ban ---
    if (isPermanentlyBanned) {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-white text-center">
                <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border-2 border-red-800 max-w-md w-full">
                    <FiSlash className="text-red-600 mx-auto mb-4" size={50} />
                    <h1 className="text-3xl font-bold text-red-500 mb-2">Conta Banida Permanentemente</h1>
                    <p className="text-gray-400">
                        Sua conta foi desativada de forma permanente por violar repetidamente os termos de serviço e os critérios de qualidade da plataforma.
                    </p>
                    <p className="text-xs text-gray-600 mt-6">
                        Esta ação é irreversível. Para mais informações, entre em contato com o suporte.
                    </p>
                </div>
            </div>
        );
    }
    
    // --- UI for Temporary Suspension ---
    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-white text-center">
            <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-red-500/50 max-w-md w-full">
                <FiAlertTriangle className="text-red-500 mx-auto mb-4" size={50} />
                <h1 className="text-3xl font-bold text-red-400 mb-2">Suspenso Temporariamento</h1>
                <p className="text-gray-300 mb-6">
                    Sua conta foi temporariamente suspensa por não atingir os critérios mínimos de qualidade.
                </p>


                {timeLeft && (
                    <div className="my-8">
                        <p className="text-gray-400 mb-4">Você poderá solicitar uma reavaliação em:</p>
                        <div className="flex justify-center items-center gap-2 sm:gap-4 text-3xl sm:text-4xl font-mono bg-gray-900 p-4 rounded-lg">
                            <div><span className="font-bold">{formatTime(timeLeft.days)}</span><span className="block text-xs sm:text-sm font-sans text-gray-500">dias</span></div>
                            <div className="text-2xl sm:text-3xl text-gray-600">:</div>
                            <div><span className="font-bold">{formatTime(timeLeft.hours)}</span><span className="block text-xs sm:text-sm font-sans text-gray-500">horas</span></div>
                            <div className="text-2xl sm:text-3xl text-gray-600">:</div>
                            <div><span className="font-bold">{formatTime(timeLeft.minutes)}</span><span className="block text-xs sm:text-sm font-sans text-gray-500">min</span></div>
                            <div className="text-2xl sm:text-3xl text-gray-600">:</div>
                            <div><span className="font-bold">{formatTime(timeLeft.seconds)}</span><span className="block text-xs sm:text-sm font-sans text-gray-500">seg</span></div>
                        </div>
                    </div>
                )}

                {isAppealable && !timeLeft && (
                     <p className="text-green-400 font-semibold my-8">
                        O prazo de espera terminou. Você já pode solicitar sua reavaliação.
                    </p>
                )}

                <button
                    onClick={handleAppeal}
                    disabled={!isAppealable}
                    className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-lg font-bold text-lg transition-all duration-300 ${
                        isAppealable
                            ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/50 cursor-pointer'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <FaWhatsapp size={24} />
                    <span>Solicitar Reavaliação</span>
                </button>
                <p className="text-xs text-gray-500 mt-4">
                    O botão será liberado automaticamente após o término da contagem.
                </p>
            </div>
        </div>
    );
};


// --- Main Dashboard Page Component ---
function DashboardPage() {
    const { currentUser, hasNotificationPermission, checkAndRequestNotificationPermission } = useAuth();
    const hasLoggedView = useRef(false);

    // Determines if any type of ban is active.
    const isBanned = (currentUser?.nota_final_unificada < 3 && !currentUser?.is_permanently_banned) || currentUser?.is_permanently_banned;

    useEffect(() => {
        if (currentUser && !hasLoggedView.current) {
            logUserActivity(currentUser.uid, 'Acessou Dashboard');
            hasLoggedView.current = true;
        }
    }, [currentUser]);

    // If the user is banned (temporarily or permanently), render the BannedScreen.
    if (isBanned) {
        return <BannedScreen 
            bannedAt={currentUser.banned_at} 
            userName={currentUser.nome_empresa || 'Parceiro'}
            suspensionCount={currentUser.suspension_count || 1}
            isPermanentlyBanned={currentUser.is_permanently_banned || false}
        />;
    }

    // --- Icons and Logic for Normal Dashboard ---
    const MuralIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> );
    const MeusServicosIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> );
    const AgendaIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> );

    // --- JSX for Normal Dashboard (unchanged) ---
    return (
        <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8 text-white">
            <div className="max-w-4xl mx-auto">
                {hasNotificationPermission !== 'granted' && (
                    <div onClick={checkAndRequestNotificationPermission} className="bg-status-orange p-4 rounded-lg shadow-lg mb-6 cursor-pointer hover:bg-orange-500 transition-colors flex items-center gap-3">
                        <FiBell size={24} className="text-white flex-shrink-0" />
                        <p className="text-white font-bold flex-grow text-sm sm:text-base">Ative as notificações para não perder novos clientes e atualizações importantes!</p>
                    </div>
                )}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold">Bem-vindo, {currentUser?.nome_empresa || 'Parceiro'}!</h1>
                    <p className="text-gray-400 mt-2">O que você gostaria de fazer hoje?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {currentUser?.tipo !== 'tecnico' && (
                        <>
                            <Link to="/lista" className="block"><div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300"><MuralIcon /><h2 className="text-2xl font-semibold mb-2">Lista de Clientes</h2><p className="text-gray-400">Veja os novos clientes disponíveis na sua região e aceite novos serviços.</p></div></Link>
                            <Link to="/meus-servicos" className="block"><div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300"><MeusServicosIcon /><h2 className="text-2xl font-semibold mb-2">Meus Serviços</h2><p className="text-gray-400">Gerencie os serviços que você já aceitou, atualize o status e finalize os atendimentos.</p></div></Link>
                        </>
                    )}
                    {currentUser?.tipo === 'tecnico' && (
                        <>
                            <Link to="/agenda" className="block"><div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300"><AgendaIcon /><h2 className="text-2xl font-semibold mb-2">Agenda</h2><p className="text-gray-400">Organize seus compromissos e visualize seus agendamentos.</p></div></Link>
                            <div className="grid grid-cols-2 gap-6 mt-6 md:mt-0">
                                <Link to="/info" className="block"><div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg><h2 className="text-2xl font-semibold mb-2">Gasolina</h2><p className="text-gray-400">{currentUser?.km_sobrando ? `Km sobrando: ${currentUser.km_sobrando}` : 'Km sobrando: N/A'}</p></div></Link>
                                <Link to="/info" className="block"><div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg><h2 className="text-2xl font-semibold mb-2">Metas</h2><p className="text-gray-400">{currentUser?.pontuacao ? `Pontuação: ${currentUser.pontuacao}` : 'Pontuação: N/A'}</p></div></Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
