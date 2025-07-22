// src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner'; // 1. Importar o spinner

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // 2. Estado para controlar o carregamento
  const navigate = useNavigate();

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setError('');
    setLoading(true); // 3. Ativar o carregamento

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.tipo === 'parceiro' || userData.ADM === 'SIM') {
          navigate('/');
        } else {
          await auth.signOut();
          setError('Você não tem permissão para acessar este portal.');
        }
      } else {
        await auth.signOut();
        setError('Perfil de usuário não encontrado.');
      }
    } catch (err) {
      setError('Email ou senha inválidos.');
    } finally {
      setLoading(false); // 4. Desativar o carregamento, independente do resultado
    }
  };

  return (
    // 5. Novo fundo com gradiente
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-slate-800 text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* 6. Espaço para o Logo */}
          <h1 className="text-4xl font-bold tracking-wider">HigienizaPRO</h1>
          <p className="text-gray-400 mt-2">Portal do Parceiro</p>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-bold mb-2 text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-bold mb-2 text-gray-300">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

             <button
type="submit"
disabled={loading}
className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
>
{loading ? (
<div className="flex items-center justify-center gap-2">
<LoadingSpinner />
Carregando...
</div>
) : (
'Entrar'
)}
</button>
          </form>

          <div className="text-center mt-6">
            <a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition">
              Esqueceu a senha?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;