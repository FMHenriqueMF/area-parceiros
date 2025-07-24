// src/pages/DashboardPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DashboardPage() {
  const { currentUser } = useAuth();

  // Ícones SVG para deixar os cards mais bonitos
  const MuralIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const MeusServicosIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold">Bem-vindo, {currentUser?.nome_empresa || 'Parceiro'}!</h1>
          <p className="text-gray-400 mt-2">O que você gostaria de fazer hoje?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card para o Mural */}
          <Link to="/mural" className="block">
            <div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300">
              <MuralIcon />
              <h2 className="text-2xl font-semibold mb-2">Mural de Clientes</h2>
              <p className="text-gray-400">Veja os novos clientes disponíveis na sua região e aceite novos serviços.</p>
            </div>
          </Link>

          {/* Card para Meus Serviços */}
          <Link to="/meus-servicos" className="block">
            <div className="bg-gray-800 p-6 rounded-lg h-full border border-gray-700 hover:border-brand-blue hover:bg-gray-700/50 transition-all duration-300">
              <MeusServicosIcon />
              <h2 className="text-2xl font-semibold mb-2">Meus Serviços</h2>
              <p className="text-gray-400">Gerencie os serviços que você já aceitou, atualize o status e finalize os atendimentos.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;