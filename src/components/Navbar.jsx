// src/components/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
                    <Link to="/" className="text-xl font-bold text-brand-blue">Extrema Limpeza</Link>
          <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Mural</Link>
          <Link to="/meus-servicos" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Meus Serviços</Link>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-gray-400 text-sm hidden sm:block">{currentUser?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;