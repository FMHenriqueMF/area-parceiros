// src/components/BottomNav.jsx

import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiClipboard, FiDollarSign, FiUser, FiCalendar, FiInfo } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

function BottomNav() {
  const { isAppLocked, currentUser } = useAuth();
  
  // The lock screen for a service in progress has priority.
  if (isAppLocked) {
    return null;
  }

  // Updated ban logic to include permanent bans
  const isBanned = (currentUser?.nota_final_unificada < 3) || currentUser?.is_permanently_banned;
  const isTecnico = currentUser?.tipo === 'tecnico';

  const getLinkClass = ({ isActive }) =>
    isActive
      ? 'flex flex-col items-center justify-center text-brand-blue'
      : 'flex flex-col items-center justify-center text-gray-400 hover:text-white';

  // If the user is banned, show a limited navigation bar.
  if (isBanned) {
    return (
      <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-gray-800 border-t border-gray-700">
        <div className={`grid h-full max-w-lg ${isTecnico ? 'grid-cols-2' : 'grid-cols-3'} mx-auto font-medium`}>
          <NavLink to="/" end className={getLinkClass}>
            <FiHome size={22} />
            <span className="text-xs">Início</span>
          </NavLink>
          
          {/* Only non-technicians have access to "Ganhos" */}
          {!isTecnico && (
            <NavLink to="/saldos" className={getLinkClass}>
              <FiDollarSign size={22} />
              <span className="text-xs">Ganhos</span>
            </NavLink> 
          )}

          <NavLink to="/perfil" className={getLinkClass}>
            <FiUser size={22} />
            <span className="text-xs">Perfil</span>
          </NavLink>
        </div>
      </div>
    );
  }

  // Original navigation bar for active users.
  const gridClass = isTecnico ? 'grid-cols-3' : 'grid-cols-5';

  return (
    <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-gray-800 border-t border-gray-700">
      <div className={`grid h-full max-w-lg ${gridClass} mx-auto font-medium`}>
        
        <NavLink to="/" end className={getLinkClass}>
          <FiHome size={22} />
          <span className="text-xs">Início</span>
        </NavLink>

        {!isTecnico && (
          <>
            <NavLink to="/lista" className={getLinkClass}>
              <FiGrid size={22} />
              <span className="text-xs text-center">Lista de Clientes</span>
            </NavLink>
            <NavLink to="/meus-servicos" className={getLinkClass}>
              <FiClipboard size={22} />
              <span className="text-xs text-center">Meus Serviços</span>
            </NavLink>
            <NavLink to="/saldos" className={getLinkClass}>
              <FiDollarSign size={22} />
              <span className="text-xs">Ganhos</span>
            </NavLink> 
            <NavLink to="/perfil" className={getLinkClass}>
              <FiUser size={22} />
              <span className="text-xs">Perfil</span>
            </NavLink>
          </>
        )}

        {isTecnico && (
          <>
            <NavLink to="/agenda" className={getLinkClass}>
              <FiCalendar size={22} />
              <span className="text-xs">Agenda</span>
            </NavLink>
            <NavLink to="/info" className={getLinkClass}>
              <FiInfo size={22} />
              <span className="text-xs">Informações</span>
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}

export default BottomNav;
