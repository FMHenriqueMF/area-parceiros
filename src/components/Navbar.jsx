// src/components/Navbar.jsx

import { NavLink, useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiClipboard, FiLogOut, FiUser, FiDollarSign, FiCalendar, FiInfo } from 'react-icons/fi';

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

  // Updated ban logic to include permanent bans
  const isBanned = (currentUser?.nota_final_unificada < 3) || currentUser?.is_permanently_banned;
  const isTecnico = currentUser?.tipo === 'tecnico';
  
  // The Navbar title now changes color and text based on the user's status.
  const titleStyle = `text-xl font-bold transition-colors ${isBanned ? 'text-red-400' : isAppLocked ? 'text-status-orange' : 'text-brand-blue'}`;

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left Side */}
          <div className="flex items-center space-x-4">
            <NavLink to="/" className={titleStyle}>
              {isBanned ? 'Conta Bloqueada' : isAppLocked ? 'Serviço em Andamento' : 'Extrema Limpeza'}
            </NavLink>

            <div className="hidden sm:flex sm:space-x-2">
              {/* Links for non-technicians */}
              {!isTecnico && (
                <>
                  {/* Restricted links only appear for active, non-banned users. */}
                  {!isBanned && !isAppLocked && (
                    <>
                      <NavLink to="/lista" className={getLinkClass}><FiGrid /> Lista de Clientes</NavLink>
                      <NavLink to="/meus-servicos" className={getLinkClass}><FiClipboard /> Meus Serviços</NavLink>
                    </>
                  )}
                  {/* "Ganhos" link is accessible to banned users, but not during a service. */}
                  {!isAppLocked && <NavLink to="/saldos" className={getLinkClass}><FiDollarSign /> Ganhos</NavLink>}
                </>
              )}

              {/* Links for technicians (hidden if banned or in service) */}
              {isTecnico && !isBanned && !isAppLocked && (
                <div className="hidden sm:flex sm:space-x-2">
                  <NavLink to="/agenda" className={getLinkClass}>
                    <FiCalendar /> Agenda
                  </NavLink>
                  <NavLink to="/info" className={getLinkClass}>
                    <FiInfo /> Informações
                  </NavLink>
                </div>
              )}
            </div>
          </div>

          {/* Right Side (Profile and Logout are always visible) */} 
          <div className="hidden sm:flex sm:items-center sm:space-x-4"> 
            <Link to="/perfil" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
              <FiUser />
              <span>{currentUser?.nome_empresa || currentUser?.email}</span>
            </Link>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full text-sm font-medium flex items-center" title="Sair">
              <FiLogOut size={18} />
            </button>
          </div>

          {/* Logout button for small screens */}
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
