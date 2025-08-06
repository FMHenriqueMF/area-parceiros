// src/components/FloatingSupportButton.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom'; // Importa hooks para saber a URL atual
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaWhatsapp } from 'react-icons/fa';

function FloatingSupportButton() {
  const { currentUser } = useAuth();
  const location = useLocation(); // Nos dá informações sobre a página atual (ex: /perfil)
  const params = useParams(); // Nos dá os parâmetros da URL (ex: o ID do cliente)

  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Este useEffect roda toda vez que a página ou o usuário muda
  useEffect(() => {
    const supportPhoneNumber = '555183315715'; // ATENÇÃO: Substitua pelo seu número de suporte
    const nomeEmpresa = currentUser?.nome_empresa || 'Parceiro';
    let baseMessage = `Olá, sou da empresa ${nomeEmpresa} e preciso de ajuda no app.`;

    const buildUrl = async () => {
      // Verifica em qual página estamos e customiza a mensagem
      if (location.pathname.startsWith('/cliente/')) {
        // Se estamos na página de um cliente, busca a OS dele
        const clienteId = params.id;
        if (clienteId) {
          try {
            const clientRef = doc(db, 'clientes', clienteId);
            const docSnap = await getDoc(clientRef);
            if (docSnap.exists()) {
              const osNumber = docSnap.data().ultimos4 || 'desconhecida';
              baseMessage = `Olá, sou da empresa ${nomeEmpresa} e preciso de ajuda com o cliente de OS ${osNumber}.`;
            }
          } catch (error) {
            console.error("Erro ao buscar dados do cliente para o link do WhatsApp:", error);
          }
        }
      } else if (location.pathname.startsWith('/perfil')) {
        baseMessage = `Olá, sou da empresa ${nomeEmpresa} e preciso de ajuda na minha página de Perfil.`;
      } else if (location.pathname.startsWith('/meus-servicos')) {
        baseMessage = `Olá, sou da empresa ${nomeEmpresa} e preciso de ajuda com a minha lista de serviços.`;
      } else if (location.pathname.startsWith('/saldos')) {
        baseMessage = `Olá, sou da empresa ${nomeEmpresa} e preciso de ajuda com o meu painel de ganhos.`;
      } else if (location.pathname.startsWith('/lista')) {
        baseMessage = `Olá, sou da empresa ${nomeEmpresa} e preciso de ajuda com o minha Lista de Clientes.`;
      }

      setWhatsappUrl(`https://wa.me/${supportPhoneNumber}?text=${encodeURIComponent(baseMessage)}`);
    };

    buildUrl();
  }, [location.pathname, params.id, currentUser]); // A mágica acontece aqui

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-6 bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-60 transition-transform z-50"
      title="Falar com o Suporte"
    >
      <FaWhatsapp size={30} />
    </a>
  );
}

export default FloatingSupportButton;