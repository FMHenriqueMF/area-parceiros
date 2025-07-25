// src/components/Navbar.jsx

import { NavLink, useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiClipboard, FiLogOut, FiUser, FiDollarSign } from 'react-icons/fi'; // Importar FiDollarSign

function Navbar() {
  const { currentUser, isAppLocked } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getLinkClass = ({ isActive }) =>
    isActive
      ? 'bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2';

  const titleStyle = `text-xl font-bold ${isAppLocked ? 'text-status-orange' : 'text-brand-blue'}`;

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Lado Esquerdo */}
          <div className="flex items-center space-x-4">
            <NavLink to="/" className={titleStyle}>
              {isAppLocked ? 'Serviço em Andamento' : 'Extrema Limpeza'}
            </NavLink>
            <div className="hidden sm:flex sm:space-x-2">
              {isAppLocked ? <span className="text-gray-500 ..."><FiGrid /> Mural</span> : <NavLink to="/mural" className={getLinkClass}><FiGrid /> Mural</NavLink>}
              {isAppLocked ? <span className="text-gray-500 ..."><FiClipboard /> Meus Serviços</span> : <NavLink to="/meus-servicos" className={getLinkClass}><FiClipboard /> Meus Serviços</NavLink>}
              
              {/* NOVO LINK PARA SALDOS */}
              {isAppLocked ? <span className="text-gray-500 ..."><FiDollarSign /> Saldos</span> : <NavLink to="/saldos" className={getLinkClass}><FiDollarSign /> Saldos</NavLink>}
            </div>
          </div>

          {/* Lado Direito */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {/* MUDANÇA AQUI: O nome agora é um Link */}
            <Link to="/perfil" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
              <FiUser />
              <span>{currentUser?.nome_empresa || currentUser?.email}</span>
            </Link>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full text-sm font-medium flex items-center" title="Sair">
              <FiLogOut size={18} />
            </button>
          </div>

          {/* Botão de Sair para telas pequenas */}
          <div className="sm:hidden flex items-center">
             <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full text-sm font-medium flex items-center" title="Sair">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;