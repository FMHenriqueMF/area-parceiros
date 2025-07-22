// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // 1. Verifica se existe um usuário logado
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // 2. Verifica se o usuário tem as permissões corretas
  const isAuthorized = currentUser.tipo === 'parceiro' || currentUser.ADM === 'SIM';
  if (!isAuthorized) {
    // Se não for autorizado, pode deslogar e redirecionar
    // Para simplificar, vamos apenas redirecionar
    return <Navigate to="/login" />;
  }

  // 3. Se tudo estiver certo, mostra a página solicitada
  return children;
};

export default ProtectedRoute;