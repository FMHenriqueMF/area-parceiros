// src/pages/MeusServicosPage.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ClientCard from '../components/ClientCard.jsx';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function MeusServicosPage() {
  const { currentUser } = useAuth();
  const [meusClientes, setMeusClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      // AQUI ESTÁ A MUDANÇA: Buscamos na coleção 'clientes' onde o campo
      // 'parceiroId' é IGUAL ao ID do usuário logado.
      const q = query(
        collection(db, "clientes"),
        where("parceiroId", "==", currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clientesDoParceiro = [];
        querySnapshot.forEach((doc) => {
          clientesDoParceiro.push({ id: doc.id, ...doc.data() });
        });
        setMeusClientes(clientesDoParceiro);
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
        <h1 className="text-4xl font-bold text-white mb-8">Meus Serviços Agendados</h1>

        {meusClientes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {meusClientes.map((cliente) => (
              // Reutilizamos o ClientCard, mas agora ele vai para a página de detalhes
                <ClientCard key={cliente.id} cliente={cliente} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center text-lg">
            Você ainda não pegou nenhum serviço. Vá para o mural para encontrar novos clientes!
          </p>
        )}
      </div>
    </div>
  );
}

export default MeusServicosPage;