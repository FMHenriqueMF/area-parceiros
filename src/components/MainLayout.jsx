// src/components/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav'; // 1. Importar a BottomNav
import FloatingSupportButton from './FloatingSupportButton'; // 1. Importar o novo componente
import NewsletterBadge from './NewsletterBadge'; // Newsletter de atualizações


function MainLayout() {
  return (
    // Adicionamos um padding-bottom para o conteúdo não ficar atrás da BottomNav no celular
    <div className="pb-16 sm:pb-0">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <BottomNav /> {/* 2. Adicionar a BottomNav aqui */}
      <FloatingSupportButton /> {/* 2. Adicionar o botão aqui */}
      <NewsletterBadge /> {/* Newsletter badge discreto */}
    </div>
  );
}

export default MainLayout;