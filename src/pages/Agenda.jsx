// src/pages/Agenda.jsx

import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import TecnicoServiceCard from '../components/TecnicoServiceCard.jsx';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { logUserActivity } from '../utils/logger.js';

// Função auxiliar para formatar a data como DD/MM/YYYY
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Função auxiliar para verificar se a string é 'Manhã' ou 'Tarde'
const getPeriodPriority = (period) => {
  if (!period) return 2;
  const lowerPeriod = period.toLowerCase();
  if (lowerPeriod.includes('manhã')) return 0;
  if (lowerPeriod.includes('tarde')) return 1;
  return 2;
};

function Agenda() {
  const { currentUser, loading: authLoading } = useAuth();
  const [servicosDisponiveis, setServicosDisponiveis] = useState([]);
  const [filteredServicos, setFilteredServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoggedView = useRef(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date();

useEffect(() => {
    if (authLoading || !currentUser) {
      setLoading(false);
      setServicosDisponiveis([]);
      return;
    }
    if (currentUser && !hasLoggedView.current) {
      logUserActivity(currentUser.uid, 'Acessou Agenda');
      hasLoggedView.current = true;
    }

    const formattedSelectedDate = formatDate(selectedDate); // Pega a data formatada

    const q = query(
      collection(db, "clientes"),
      where("Estado", "==", currentUser.estado),
      where("data", "==", formattedSelectedDate), // <-- FILTRO ADICIONADO AQUI!
      where("status", "in", ["disponivel", "aceito", "tecdeslocamento", "teccheguei", "aguardandopagamento"])
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicosDoEstado = [];
      querySnapshot.forEach((doc) => {
        servicosDoEstado.push({ id: doc.id, ...doc.data() });
      });

      setServicosDisponiveis(servicosDoEstado); // Agora já vem com os serviços só do dia certo
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar serviços:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, authLoading, selectedDate]); // <-- ADICIONADO selectedDate ÀS DEPENDÊNCIAS

  // useEffect de ORDENAÇÃO (não precisa mais filtrar)
  useEffect(() => {
    const servicosOrdenados = [...servicosDisponiveis] // <-- Apenas ordena
      .sort((a, b) => {
        const periodA = getPeriodPriority(a.periodo_preferencia);
        const periodB = getPeriodPriority(b.periodo_preferencia);
        
        if (periodA !== periodB) {
          return periodA - periodB;
        }

        const timeA = a.horario ? a.horario.split(':').map(Number) : [99, 99];
        const timeB = b.horario ? b.horario.split(':').map(Number) : [99, 99];
        
        if (timeA[0] !== timeB[0]) {
          return timeA[0] - timeB[0];
        }
        return timeA[1] - timeB[1];
      });

    setFilteredServicos(servicosOrdenados);
  }, [servicosDisponiveis]);

  // useEffect para filtrar e ordenar os serviços sempre que a data ou a lista de serviços mudar
  useEffect(() => {
    const formattedSelectedDate = formatDate(selectedDate);
    const servicosDoDia = servicosDisponiveis
      .filter(servico => servico.data === formattedSelectedDate)
      .sort((a, b) => {
        const periodA = getPeriodPriority(a.periodo_preferencia);
        const periodB = getPeriodPriority(b.periodo_preferencia);
        
        if (periodA !== periodB) {
          return periodA - periodB;
        }

        const timeA = a.horario ? a.horario.split(':').map(Number) : [99, 99];
        const timeB = b.horario ? b.horario.split(':').map(Number) : [99, 99];
        
        if (timeA[0] !== timeB[0]) {
          return timeA[0] - timeB[0];
        }
        return timeA[1] - timeB[1];
      });

    setFilteredServicos(servicosDoDia);
  }, [servicosDisponiveis, selectedDate]);

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const handlePreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(selectedDate.getDate() - 1);
    setSelectedDate(previousDay);
  };

  if (loading || authLoading) {
    return <div className="text-white text-center p-10">Carregando sua agenda...</div>;
  }

  const isToday = formatDate(selectedDate) === formatDate(today);
  const displayDate = isToday ? `Hoje, ${formatDate(selectedDate)}` : formatDate(selectedDate);

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Agenda</h1>

        {/* CONTROLES DE NAVEGAÇÃO DE DATA */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <button onClick={handlePreviousDay} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white">
            <FiChevronLeft size={24} />
          </button>
          <span className="text-xl font-bold text-white min-w-[150px] text-center">
            {displayDate}
          </span>
          <button onClick={handleNextDay} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white">
            <FiChevronRight size={24} />
          </button>
        </div>

        {filteredServicos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServicos.map((servico) => (
              <TecnicoServiceCard key={servico.id} cliente={servico} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-3">Sua Agenda está Vazia</h2>
            <p className="text-gray-400 mb-8">Parece que você não tem nenhum serviço agendado para este dia.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Agenda;