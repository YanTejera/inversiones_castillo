import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './notificaciones/NotificationCenter';
import MobileNavigation from './MobileNavigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Bike,
  Users,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  FileText,
  FolderOpen,
  LogOut,
  Settings,
  Building,
  Bell,
} from 'lucide-react';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Motocicletas',
      href: '/motos',
      icon: Bike,
      current: location.pathname.startsWith('/motos'),
    },
    {
      name: 'Proveedores',
      href: '/proveedores',
      icon: Building,
      current: location.pathname.startsWith('/proveedores'),
    },
    {
      name: 'Clientes',
      href: '/clientes',
      icon: Users,
      current: location.pathname.startsWith('/clientes'),
    },
    {
      name: 'Ventas',
      href: '/ventas',
      icon: ShoppingCart,
      current: location.pathname.startsWith('/ventas'),
    },
    {
      name: 'Pagos',
      href: '/pagos',
      icon: CreditCard,
      current: location.pathname === '/pagos',
    },
    {
      name: 'Cobros Pendientes',
      href: '/cobros',
      icon: AlertTriangle,
      current: location.pathname.startsWith('/cobros'),
    },
    {
      name: 'Documentos',
      href: '/documentos',
      icon: FolderOpen,
      current: location.pathname.startsWith('/documentos'),
    },
    {
      name: 'Reportes',
      href: '/reportes',
      icon: FileText,
      current: location.pathname.startsWith('/reportes'),
    },
    {
      name: 'Configuración',
      href: '/configuracion',
      icon: Settings,
      current: location.pathname.startsWith('/configuracion'),
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:w-64`}>
        <div className="flex items-center justify-between h-16 bg-gray-900 px-4">
          <div className="flex items-center min-w-0">
            <img 
              src="/logo.png" 
              alt="Inversiones C&C Logo" 
              className="h-8 w-8 flex-shrink-0 rounded-full bg-white p-1 object-contain" 
            />
            <span className="ml-2 text-white text-base sm:text-lg font-semibold truncate">Inversiones C&C</span>
          </div>
          <button
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-2 iphone-bottom-fix">
          <div className="flex items-center text-white text-sm mb-4">
            <div className="bg-gray-600 rounded-full p-2 mr-3 flex-shrink-0">
              <Settings className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.rol_nombre}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors group"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar - Mobile */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden iphone-header-fix">
          <div className="flex items-center justify-between px-4">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Inversiones C&C Logo" 
                className="h-6 w-6 mr-2 flex-shrink-0 object-contain" 
              />
              <span className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                Inversiones C&C
              </span>
            </div>
            <div className="flex-shrink-0">
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Top bar - Desktop */}
        <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Inversiones C&C Logo" 
                className="h-8 w-8 mr-3 flex-shrink-0 object-contain" 
              />
              <span className="text-lg font-semibold text-gray-900">
                Sistema de Gestión - Inversiones C&C
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Bienvenido, {user?.first_name} {user?.last_name}
              </div>
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-4 sm:py-6 pb-20 lg:pb-6 safe-x">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

    </div>
  );
};

export default Layout;