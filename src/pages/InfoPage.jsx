// src/pages/InfoPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// Importamos as funções do Firestore para buscar os dados
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';


function InfoPage() {
    const { currentUser } = useAuth();
    const [historicoCombustivel, setHistoricoCombustivel] = useState([]);
    const [metas, setMetas] = useState({
        semanaAtual: null,
        semanaPassada: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            try {
                setIsLoading(true);

                // NOVO: Buscando os dados de pontuação do documento do usuário
                const userDocRef = doc(db, "usuarios", currentUser.uid); // Coleção de usuários
                const userDocSnap = await getDoc(userDocRef);

                let pontuacaoSemanaAtual = 0;
                let pontuacaoSemanaPassada = 0;

                // Verificamos se o documento do usuário existe e pegamos a pontuação
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    pontuacaoSemanaAtual = userData.pontuacaoSemanaAtual || 0;
                    pontuacaoSemanaPassada = userData.pontuacaoSemanaPassada || 0;
                }

                // Exemplo de dados mockados para simular a resposta da API (agora com a pontuação real)
                const historicoCombustivelData = [
                    { data: '2025-07-25', rotaDetalhes: 'Casa -> Atendimento 1 -> Atendimento 2 -> Casa', kmRodados: 55 },
                    { data: '2025-07-24', rotaDetalhes: 'Casa -> Atendimento 1 -> Casa', kmRodados: 32 },
                ];

                setHistoricoCombustivel(historicoCombustivelData);
                // ATUALIZADO: Usando os dados do Firestore para preencher o estado de metas
                setMetas({
                    semanaAtual: { pontuacao: pontuacaoSemanaAtual, recompensa: null, metaAlcancada: false },
                    semanaPassada: { pontuacao: pontuacaoSemanaPassada, recompensa: null, metaAlcancada: false },
                });

            } catch (err) {
                console.error("Erro ao buscar os dados do usuário:", err);
                setError('Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const getRecompensa = (pontuacao) => {
        if (pontuacao >= 6256) return 'R$ 800,00';
        if (pontuacao >= 5474) return 'R$ 600,00';
        if (pontuacao >= 4692) return 'R$ 450,00';
        if (pontuacao >= 3910) return 'R$ 250,00';
        if (pontuacao >= 3220) return 'R$ 125,00';
        return 'Nenhuma recompensa atingida.';
    };

    if (isLoading) {
        return <div className="bg-gray-900 min-h-screen p-8 text-white">Carregando dados...</div>;
    }

    if (error) {
        return <div className="bg-gray-900 min-h-screen p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8 text-white">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Informações do Técnico</h1>

                {/* Seção de Metas */}
                <div className="mb-12">
                    <h2 className="text-3xl font-semibold mb-4">Metas Semanais</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card da Semana Atual */}
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                            <h3 className="text-2xl font-bold mb-2">Semana Atual</h3>
                            <p className="text-gray-400">Pontuação: <span className="text-brand-blue font-semibold">{metas.semanaAtual?.pontuacao}</span></p>
                            <p className="text-gray-400">Status: <span className="text-status-green font-semibold">{getRecompensa(metas.semanaAtual?.pontuacao) !== 'Nenhuma recompensa atingida.' ? 'Meta alcançada!' : 'Em progresso...'}</span></p>
                            <p className="text-gray-400">Recompensa: <span className="text-status-orange font-semibold">{getRecompensa(metas.semanaAtual?.pontuacao)}</span></p>
                        </div>
                        {/* Card da Semana Passada */}
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                            <h3 className="text-2xl font-bold mb-2">Semana Passada</h3>
                            <p className="text-gray-400">Pontuação: <span className="text-brand-blue font-semibold">{metas.semanaPassada?.pontuacao}</span></p>
                            <p className="text-gray-400">Status: <span className="text-status-green font-semibold">{getRecompensa(metas.semanaPassada?.pontuacao) !== 'Nenhuma recompensa atingida.' ? 'Meta alcançada!' : 'Não alcançada.'}</span></p>
                            <p className="text-gray-400">Recompensa: <span className="text-status-orange font-semibold">{getRecompensa(metas.semanaPassada?.pontuacao)}</span></p>
                        </div>
                    </div>
                </div>

                {/* Seção de Histórico de Combustível */}
                <div>
                    <h2 className="text-3xl font-semibold mb-4">Histórico de Combustível</h2>
                    <div className="space-y-4">
                        {historicoCombustivel.length > 0 ? (
                            historicoCombustivel.map((item, index) => (
                                <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                    <p className="text-lg font-bold">{item.data}</p>
                                    <p className="text-gray-400 mt-1">Rota: {item.rotaDetalhes}</p>
                                    <p className="text-gray-400">Km rodados: <span className="text-brand-blue font-semibold">{item.kmRodados} km</span></p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400">Nenhum histórico de combustível disponível.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default InfoPage;