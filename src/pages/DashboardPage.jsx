// src/pages/DashboardPage.jsx

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../utils/logger';
import React, { useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import PopulateButton from '../components/CompleteOnboardingButton';
import { FiCalendar } from 'react-icons/fi'; // Ícone de calendário

function DashboardPage() {
    const { currentUser, hasNotificationPermission, checkAndRequestNotificationPermission } = useAuth();
    const hasLoggedView = useRef(false);

  useEffect(() => {
    if (currentUser && !hasLoggedView.current) {
      logUserActivity(currentUser.uid, 'Acessou Dashboard');
      hasLoggedView.current = true;
    }
  }, [currentUser]);

  // Ícones SVG
  const MuralIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
  
  // Ícone para Meus Serviços
  const MeusServicosIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  // Ícone para a Agenda
  const AgendaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

 return (
  <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8 text-white">
    <div className="max-w-4xl mx-auto">
      
      {/* --- BANNER DE NOTIFICAÇÕES --- */}
      {hasNotificationPermission !== 'granted' && (
        <div 
          onClick={checkAndRequestNotificationPermission}
          className="bg-status-orange p-4 rounded-lg shadow-lg mb-6 cursor-pointer hover:bg-orange-500 transition-colors flex items-center gap-3"
        >
          <FiBell size={24} className="text-white flex-shrink-0" />
          <p className="text-white font-bold flex-grow text-sm sm:text-base">
            Ative as notificações para não perder novos clientes e atualizações importantes!
          </p>
        </div>
      )}
      
      <div className="mb-12">
        <h1 className="text-4xl font-bold">Bem-vindo, {currentUser?.nome_empresa || 'Parceiro'}!</h1>
        <p className="text-gray-400 mt-2">O que você gostaria de fazer hoje?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Renderização condicional para usuários NÃO-técnicos */}
        {currentUser?.tipo !== 'tecnico' && (
            <>
                <Link to="/lista" className="block">
                    <div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300">
                        <MuralIcon />
                        <h2 className="text-2xl font-semibold mb-2">Lista de Clientes</h2>
                        <p className="text-gray-400">Veja os novos clientes disponíveis na sua região e aceite novos serviços.</p>
                    </div>
                </Link>

                <Link to="/meus-servicos" className="block">
                    <div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300">
                        <MeusServicosIcon />
                        <h2 className="text-2xl font-semibold mb-2">Meus Serviços</h2>
                        <p className="text-gray-400">Gerencie os serviços que você já aceitou, atualize o status e finalize os atendimentos.</p>
                    </div>
                </Link>
            </>
        )}
            
        {/* Renderização condicional para usuários que SÃO técnicos */}
        {currentUser?.tipo === 'tecnico' && (
            <Link to="/agenda" className="block">
                <div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300">
                    <AgendaIcon />
                    <h2 className="text-2xl font-semibold mb-2">Agenda</h2>
                    <p className="text-gray-400">Organize seus compromissos e visualize seus agendamentos.</p>
                </div>
            </Link>
        )}

      </div>
    </div>
  </div>
);}

export default DashboardPage;