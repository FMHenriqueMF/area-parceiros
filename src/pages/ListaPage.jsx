// src/pages/ListaPage.jsx

import React, { useEffect, useState, useRef } from 'react'; // Adicionar useRef
import { db } from '../firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ClientCard from '../components/ClientCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { logUserActivity } from '../utils/logger.js';

function ListaPage() {
  const { currentUser } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
    const hasLoggedView = useRef(false); // Adicionar porteiro


  useEffect(() => {
    // 1. Verificamos por 'currentUser.estado' (com 'e' minúsculo), como você corrigiu
    if (currentUser && currentUser.estado) {
      
      // 3. Lógica do "Porteiro" adicionada aqui dentro
      // Só executa o log se a "bandeira" do porteiro ainda não foi levantada
      if (!hasLoggedView.current) {
        logUserActivity(currentUser.uid, 'Acessou Lista de Clientes');
        hasLoggedView.current = true; // Avisa o porteiro para levantar a bandeira
      }

      // O resto da sua lógica de busca de clientes continua exatamente igual
      setLoading(true);
      
      // Permite que parceiros de GO vejam também clientes de DF
      const estadosPermitidos = currentUser.estado === 'GO' ? ['GO', 'DF'] : [currentUser.estado];
      
      const q = query(
        collection(db, "clientes"),
        where("status", "==", "disponivel"),
        where("Estado", "in", estadosPermitidos)
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
export default ListaPage;