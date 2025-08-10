// src/components/BottomNav.jsx

import { NavLink } from 'react-router-dom';
// Ícones padrão
import { FiHome, FiGrid, FiClipboard, FiDollarSign, FiUser } from 'react-icons/fi';
// Novos ícones para os técnicos
import { FiCalendar, FiInfo } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

function BottomNav() {
  const { isAppLocked, currentUser } = useAuth();
  
  if (isAppLocked) {
    return null;
  }

  const getLinkClass = ({ isActive }) =>
    isActive
      ? 'flex flex-col items-center justify-center text-brand-blue'
      : 'flex flex-col items-center justify-center text-gray-400 hover:text-white';
  
  // Condição para verificar se o usuário é um técnico
  const isTecnico = currentUser?.tipo === 'tecnico';
  // Define a classe do grid dinamicamente
  const gridClass = isTecnico ? 'grid-cols-3' : 'grid-cols-5';

  return (
    <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-gray-800 border-t border-gray-700">
      <div className={`grid h-full max-w-lg ${gridClass} mx-auto font-medium`}>
        
        {/* Link para Início (sempre visível) */}
        <NavLink to="/" end className={getLinkClass}>
          <FiHome size={22} />
          <span className="text-xs">Início</span>
        </NavLink>

        {/* Renderização condicional para usuários NÃO-técnicos */}
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

        {/* Renderização condicional para usuários que SÃO técnicos */}
        {isTecnico && (
          <>
            {/* Novo link para Agenda (só para técnico) */}
            <NavLink to="/agenda" className={getLinkClass}>
              <FiCalendar size={22} />
              <span className="text-xs">Agenda</span>
            </NavLink>

            {/* Novo link para Informações (só para técnico) */}
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