import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="motos" element={<div className="p-4">Módulo de Motocicletas en desarrollo</div>} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="ventas" element={<div className="p-4">Módulo de Ventas en desarrollo</div>} />
            <Route path="pagos" element={<div className="p-4">Módulo de Pagos en desarrollo</div>} />
            <Route path="reportes" element={<div className="p-4">Módulo de Reportes en desarrollo</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
