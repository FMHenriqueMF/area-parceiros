// src/components/BottomNav.jsx

import { NavLink } from 'react-router-dom';
// Adicionar o ícone de Usuário (Perfil)
import { FiHome, FiGrid, FiClipboard, FiUser, FiDollarSign } from 'react-icons/fi'; // Importado FiDollarSign
import { useAuth } from '../context/AuthContext';

function BottomNav() {
  const { isAppLocked } = useAuth();
  
  if (isAppLocked) {
    return null;
  }

  const getLinkClass = ({ isActive }) =>
    isActive
      ? 'flex flex-col items-center justify-center text-brand-blue'
      : 'flex flex-col items-center justify-center text-gray-400 hover:text-white';
  
  return (
    <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-gray-800 border-t border-gray-700">
      {/* MUDANÇA AQUI: grid-cols-4 para grid-cols-5 para acomodar o novo botão */}
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        <NavLink to="/" end className={getLinkClass}>
          <FiHome size={22} />
          <span className="text-xs">Início</span>
        </NavLink>
        <NavLink to="/mural" className={getLinkClass}>
          <FiGrid size={22} />
          <span className="text-xs">Mural</span>
        </NavLink>
        <NavLink to="/meus-servicos" className={getLinkClass}>
          <FiClipboard size={22} />
          <span className="text-xs">Meus Serviços</span>
        </NavLink>
        {/* NOVO LINK PARA SALDOS */}
<NavLink to="/saldos" className={getLinkClass}>
  <FiDollarSign size={22} />
  <span className="text-xs">Saldos</span> {/* Tente leading-none ou leading-tight */}
</NavLink>
        {/* LINK PARA O PERFIL */}
        <NavLink to="/perfil" className={getLinkClass}>
          <FiUser size={22} />
          <span className="text-xs">Perfil</span>
        </NavLink>
      </div>
    </div>
  );
}

export default BottomNav;