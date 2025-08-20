// src/utils/newsUpdates.js

import { FiZap, FiCheckCircle, FiBell, FiShield, FiTrendingUp, FiSmartphone, FiDatabase, FiClock } from 'react-icons/fi';

// Versão atual do newsletter - INCREMENTE quando adicionar novidades
export const CURRENT_NEWSLETTER_VERSION = 3; // Incrementado novamente para teste

// Lista de atualizações (mais recentes primeiro)
export const NEWS_UPDATES = [
  {
    id: 1,
    version: 1,
    date: '20/08/2024',
    title: '🚀 Grandes Melhorias no Sistema!',
    type: 'major', // major, minor, fix
    items: [
      {
        icon: FiZap,
        iconColor: 'text-yellow-400',
        title: 'Upload de Fotos Super Rápido',
        description: 'Upload paralelo com compressão automática. Fotos dos serviços enviam muito mais rápido e com menos falhas! Beneficia técnicos e parceiros.'
      },
      {
        icon: FiCheckCircle,
        iconColor: 'text-green-400',
        title: 'Processos de Pagamento Otimizados',
        description: 'Melhorias no sistema de verificação e processamento de pagamentos. Processo mais rápido e confiável para todos os usuários.'
      },
      {
        icon: FiTrendingUp,
        iconColor: 'text-emerald-400',
        title: 'Painel Financeiro Repaginado',
        description: 'Interface do painel de ganhos totalmente reformulada com informações mais claras sobre valores, histórico e solicitações de saque.'
      },
      {
        icon: FiSmartphone,
        iconColor: 'text-purple-400',
        title: 'Experiência Mobile Aprimorada',
        description: 'Navegação otimizada para smartphones e tablets. Interface mais intuitiva e responsiva em todos os dispositivos.'
      },
      {
        icon: FiShield,
        iconColor: 'text-blue-400',
        title: 'Sistema Mais Estável',
        description: 'Correções importantes de bugs e otimizações de performance. Aplicativo mais estável com menos travamentos e erros.'
      },
      {
        icon: FiDatabase,
        iconColor: 'text-indigo-400',
        title: 'Funcionamento Offline Melhorado',
        description: 'Cache inteligente permite visualizar dados mesmo sem conexão. Sincronização automática quando a internet voltar.'
      },
      {
        icon: FiClock,
        iconColor: 'text-orange-400',
        title: 'Carregamento Mais Rápido',
        description: 'Todas as telas carregam significativamente mais rápido. Navegação mais fluida entre lista de clientes, serviços e relatórios.'
      }
    ]
  }
  // 🚀 EXEMPLO de próxima atualização - descomente e configure quando necessário:
  // {
  //   id: 2,
  //   version: 2, 
  //   date: '25/08/2024',
  //   title: '✨ Novas Funcionalidades!',
  //   type: 'minor',
  //   items: [
  //     {
  //       icon: FiBell,
  //       iconColor: 'text-blue-400',
  //       title: 'Notificações Push Inteligentes',
  //       description: 'Receba alertas sobre novos serviços, atualizações de status e informações importantes direto no seu dispositivo.'
  //     },
  //     {
  //       icon: FiMapPin,
  //       iconColor: 'text-red-400', 
  //       title: 'Mapa de Clientes Aprimorado',
  //       description: 'Visualização melhorada com filtros por região, tipo de serviço e status. Encontre clientes mais rapidamente.'
  //     },
  //     {
  //       icon: FiCalendar,
  //       iconColor: 'text-green-400',
  //       title: 'Agenda e Relatórios',
  //       description: 'Sistema de agenda integrado com relatórios detalhados de performance e ganhos por período.'
  //     }
  //   ]
  // }
];

// Função para obter atualizações não vistas
export const getUnseenUpdates = (lastSeenVersion = 0) => {
  return NEWS_UPDATES.filter(update => update.version > lastSeenVersion);
};

// Função para obter o tipo de badge
export const getTypeBadge = (type) => {
  const badges = {
    major: { label: '🚀 Atualização Major', color: 'bg-gradient-to-r from-purple-600 to-blue-600' },
    minor: { label: '✨ Melhorias', color: 'bg-gradient-to-r from-blue-600 to-cyan-600' },
    fix: { label: '🔧 Correções', color: 'bg-gradient-to-r from-green-600 to-emerald-600' },
    security: { label: '🛡️ Segurança', color: 'bg-gradient-to-r from-red-600 to-pink-600' }
  };
  
  return badges[type] || { label: '📢 Novidades', color: 'bg-gradient-to-r from-gray-600 to-gray-700' };
};

// Função para adicionar log de visualização
export const logNewsletterView = (userId, version) => {
  console.log(`📧 Newsletter v${version} visualizado por usuário ${userId}`);
  // Aqui você pode adicionar analytics se necessário
};