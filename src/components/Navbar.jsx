// src/components/Navbar.jsx

import { useState } from 'react'; // Precisamos do useState para controlar o menu
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { currentUser, isAppLocked } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para controlar o menu mobile

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const linkStyle = isAppLocked 
    ? "text-gray-500 cursor-not-allowed block px-3 py-2 rounded-md text-base font-medium" 
    : "text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium";
  
  const titleStyle = `text-xl font-bold ${isAppLocked ? 'text-status-orange' : 'text-brand-blue'}`;

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Lado Esquerdo da Navbar */}
          <div className="flex items-center space-x-4">
            <Link to="/" className={titleStyle}>
              {isAppLocked ? 'Serviço em Andamento' : 'Extrema Limpeza'}
            </Link>
            {/* Links para telas maiores */}
            <div className="hidden sm:flex sm:space-x-2">
              {isAppLocked ? <span className={linkStyle.replace('block', '')}>Mural</span> : <Link to="/" className={linkStyle.replace('block', '')}>Mural</Link>}
              {isAppLocked ? <span className={linkStyle.replace('block', '')}>Meus Serviços</span> : <Link to="/meus-servicos" className={linkStyle.replace('block', '')}>Meus Serviços</Link>}
            </div>
          </div>

          {/* Lado Direito da Navbar */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <span className="text-gray-400 text-sm">
              {currentUser?.nome_empresa || currentUser?.email}
            </span>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium">
              Sair
            </button>
          </div>

          {/* Botão Hambúrguer para telas pequenas */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Abrir menu principal</span>
              {/* Ícone de Hambúrguer/X */}
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      {isMenuOpen && (
        <div className="sm:hidden pb-3">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAppLocked ? <span className={linkStyle}>Mural</span> : <Link to="/" className={linkStyle}>Mural</Link>}
            {isAppLocked ? <span className={linkStyle}>Meus Serviços</span> : <Link to="/meus-servicos" className={linkStyle}>Meus Serviços</Link>}
          </div>
          {/* Itens do lado direito no menu mobile */}
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-4">
              <div className="text-base font-medium text-white">{currentUser?.nome_empresa || currentUser?.email}</div>
            </div>
            <div className="mt-3 px-2">
              <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;