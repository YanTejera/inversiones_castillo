import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Motocicletas from './pages/Motocicletas';
import Ventas from './pages/Ventas';
import Pagos from './pages/Pagos';
import CobrosPendientes from './pages/CobrosPendientes';
import Documentos from './pages/Documentos';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

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
            <Route path="motos" element={<Motocicletas />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="cobros" element={<CobrosPendientes />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
