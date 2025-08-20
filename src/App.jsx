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
import React, { useEffect, useState } from 'react';
// Imports necessários para o Firebase
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore'; 
import { NotificationProvider } from './context/NotificationContext.jsx';
import Agenda from './pages/Agenda.jsx';
import TecnicoDetailPage from './pages/TecnicoDetailPage.jsx';
import MapaClientesPage from './pages/MapaClientesPage.jsx'; // 1. Importe a nova página

import InfoPage from './pages/InfoPage.jsx';

function App() {
  const { currentUser, loading } = useAuth();
  const [isAppOutdated, setIsAppOutdated] = useState(false);

  useEffect(() => {
    // A escuta só deve ser ativada se houver um usuário logado
    if (!currentUser) {
      return;
    }

    const db = getFirestore();
    const userRef = doc(db, 'usuarios', currentUser.uid);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      // Verifica se o documento do usuário existe
      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        // A gente verifica se o campo forceReloadRequired existe e se é true
        const needsReload = userData.forceReloadRequired === true;

        if (needsReload) {
          setIsAppOutdated(true);
        } else {
          setIsAppOutdated(false);
        }
      } else {
        // Se o documento não existir, consideramos que não há necessidade de atualização
        // A lógica de criação do campo com true fica por conta do script de emergência
        setIsAppOutdated(false);
      }
    });

    if (currentUser) {
      requestNotificationPermission(currentUser.uid);
    }

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se o aplicativo estiver desatualizado, renderizamos a tela de bloqueio
  if (isAppOutdated) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', zIndex: 9999
      }}>
        <h1>Nova Atualização!</h1>
        <p>A versão que você está usando está desatualizada e pode apresentar erros. Por favor, recarregue a página para continuar.</p>
        <button
          onClick={() => {
            // Resetando a flag para o usuário atual antes de recarregar
            const db = getFirestore();
            const userRef = doc(db, 'usuarios', currentUser.uid);
            updateDoc(userRef, {
                forceReloadRequired: false
            }).then(() => {
                window.location.reload();
            });
          }}
          style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1em', cursor: 'pointer' }}
        >
          Clique Aqui para Recarregar Agora
        </button>
      </div>
    );
  }

  // Renderização normal do aplicativo
  return (
    <NotificationProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} >
          <Route index element={<DashboardPage />} />
          <Route path="lista" element={<ListaPage />} />
          <Route path="cliente/:id" element={<ClientDetailPage />} />
          <Route path='info' element={<InfoPage/>}/>
          <Route path="servico/:id" element={<TecnicoDetailPage />} />
                  <Route path="mapa" element={<MapaClientesPage />} />

          <Route path="meus-servicos" element={<MeusServicosPage />} />
          <Route path="saldos" element={<PainelGanhos />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="agenda" element={<Agenda />} />
        </Route>
      </Routes>
    </NotificationProvider>
  );
}

export default App;