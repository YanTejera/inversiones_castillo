import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Motocicletas from './pages/Motocicletas';
import Proveedores from './pages/Proveedores';
import ProveedorNuevo from './pages/ProveedorNuevo';
import ProveedorDetalle from './pages/ProveedorDetalle';
import ProveedorEditar from './pages/ProveedorEditar';
import ProveedorDashboardPage from './pages/ProveedorDashboardPage';
import ProveedorReportsPage from './pages/ProveedorReportsPage';
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
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="proveedores/dashboard" element={<ProveedorDashboardPage />} />
            <Route path="proveedores/reportes" element={<ProveedorReportsPage />} />
            <Route path="proveedores/nuevo" element={<ProveedorNuevo />} />
            <Route path="proveedores/:id" element={<ProveedorDetalle />} />
            <Route path="proveedores/:id/editar" element={<ProveedorEditar />} />
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
