// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom'; // 1. Importar useLocation
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAppLocked, activeServiceId } = useAuth(); // 2. Pegar os novos estados
  const location = useLocation(); // 3. Hook para saber a URL atual

  // Se não há usuário logado, manda para o login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // 4. LÓGICA DE BLOQUEIO TOTAL
  // Se o app está bloqueado E o usuário NÃO está na página do serviço ativo
  if (isAppLocked && activeServiceId && location.pathname !== `/cliente/${activeServiceId}`) {
    // Força o redirecionamento para a página do serviço ativo
    return <Navigate to={`/cliente/${activeServiceId}`} replace />;
  }

  // Se passou por todas as verificações, permite o acesso à página solicitada
  return children;
};

export default ProtectedRoute;