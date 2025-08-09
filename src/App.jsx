// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import ListaPage from './pages/ListaPage.jsx';
import ClientDetailPage from './pages/ClientDetailPage.jsx';
import MeusServicosPage from './pages/MeusServicosPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PerfilPage from './pages/PerfilPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MainLayout from './components/MainLayout.jsx';
import PainelGanhos from './pages/PainelGanhos.jsx';
import { requestNotificationPermission } from './utils/push-notifications';
import { useAuth } from './context/AuthContext';
import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Agenda from './pages/Agenda.jsx';
import TecnicoDetailPage from './pages/TecnicoDetailPage.jsx';


function App() {
  // Agora pegamos o estado de 'loading' também!
  const { currentUser, loading } = useAuth(); // Pegamos loading

  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission(currentUser.uid);
    }
  }, [currentUser]);

  // Se o loading for verdadeiro, a gente não renderiza nada ainda.
  // Isso resolve a corrida de roteamento.
  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} >
        <Route index element={<DashboardPage />} />
        <Route path="lista" element={<ListaPage />} />
              <Route path="cliente/:id" element={<ClientDetailPage />} />

        <Route path="servico/:id" element={<TecnicoDetailPage />} />
        <Route path="meus-servicos" element={<MeusServicosPage />} />
        <Route path="saldos" element={<PainelGanhos />} />
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="agenda" element={<Agenda />} />

      </Route>
    </Routes>
  );
}

export default App;