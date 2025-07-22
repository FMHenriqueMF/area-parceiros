// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MuralPage from './pages/MuralPage';
import ProtectedRoute from './components/ProtectedRoute'; // 1. Importar

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* 2. A rota principal agora é protegida */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MuralPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;