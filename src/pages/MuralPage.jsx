// src/pages/MuralPage.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ClientCard from '../components/ClientCard.jsx';
import { useAuth } from '../context/AuthContext';

function MuralPage() {
  const { currentUser } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificamos por 'currentUser.estado' (com 'e' minúsculo), como você corrigiu
    if (currentUser && currentUser.estado) {
      const q = query(
        collection(db, "clientes"),
        where("status", "==", "disponivel"),
        // 2. Comparamos o campo 'Estado' (maiúsculo) com o valor de 'currentUser.estado' (minúsculo)
        where("Estado", "==", currentUser.estado) 
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clientesDisponiveis = [];
        querySnapshot.forEach((doc) => {
          clientesDisponiveis.push({ id: doc.id, ...doc.data() });
        });
        setClientes(clientesDisponiveis);
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar clientes: ", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return <div className="text-white text-center p-10">Carregando clientes...</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Clientes Disponíveis</h1>

        {clientes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clientes.map((cliente) => (
              <ClientCard key={cliente.id} cliente={cliente} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center text-lg">
            Nenhum cliente disponível no seu estado ({currentUser?.estado}) no momento.
          </p>
        )}
      </div>
    </div>
  );
}

// 3. Garantir que a exportação default está aqui no final
export default MuralPage;