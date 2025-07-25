// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import MuralPage from './pages/MuralPage.jsx';
import ClientDetailPage from './pages/ClientDetailPage.jsx';
import MeusServicosPage from './pages/MeusServicosPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PerfilPage from './pages/PerfilPage.jsx'; // 1. Importar a nova página
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MainLayout from './components/MainLayout.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} >
        <Route index element={<DashboardPage />} />
        <Route path="mural" element={<MuralPage />} />
        <Route path="cliente/:id" element={<ClientDetailPage />} />
        <Route path="meus-servicos" element={<MeusServicosPage />} />
        <Route path="perfil" element={<PerfilPage />} /> {/* 2. Adicionar a nova rota */}
      </Route>
    </Routes>
  );
}

export default App;