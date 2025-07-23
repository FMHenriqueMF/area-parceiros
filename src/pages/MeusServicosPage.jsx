// src/pages/MeusServicosPage.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import MyServiceClientCard from '../components/MyServiceClientCard.jsx';
import { Link } from 'react-router-dom'; // 1. Importar o Link

function MeusServicosPage() {
  const { currentUser } = useAuth();
  const [meusClientes, setMeusClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const q = query(
        collection(db, "clientes"),
        where("parceiroId", "==", currentUser.uid),
        where("status", "==", "aceito")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clientesDoParceiro = [];
        querySnapshot.forEach((doc) => {
          clientesDoParceiro.push({ id: doc.id, ...doc.data() });
        });

        clientesDoParceiro.sort((a, b) => {
          const parseDate = (dateStr) => {
            if (!dateStr || typeof dateStr !== 'string') return new Date(0);
            const parts = dateStr.split('/');
            if (parts.length !== 3) return new Date(0);
            return new Date(+parts[2], parts[1] - 1, +parts[0]);
          };
          const dateA = parseDate(a.data);
          const dateB = parseDate(b.data);
          return dateA - dateB;
        });

        setMeusClientes(clientesDoParceiro);
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar serviços:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return <div className="text-white text-center p-10">Carregando seus serviços...</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Meus Serviços Aceitos</h1>

        {meusClientes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {meusClientes.map((cliente) => (
              <MyServiceClientCard key={cliente.id} cliente={cliente} />
            ))}
          </div>
        ) : (
          // --- ESTA É A SEÇÃO ATUALIZADA ---
          <div className="text-center py-20 px-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-3">Sua Agenda está Vazia</h2>
            <p className="text-gray-400 mb-8">Parece que você não tem nenhum serviço aceito no momento.</p>
            <Link 
              to="/" 
              className="bg-brand-blue hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition duration-300 inline-block"
            >
              Encontrar Novos Clientes no Mural
            </Link>
          </div>
          // ------------------------------------
        )}
      </div>
    </div>
  );
}

export default MeusServicosPage;