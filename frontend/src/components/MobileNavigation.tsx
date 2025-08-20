import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bike,
  Users,
  ShoppingCart,
  CreditCard,
  Settings,
  Building,
} from 'lucide-react';

const MobileNavigation: React.FC = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Motos',
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
    }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center py-2 px-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center p-2 min-w-0 flex-1 text-center ${
                item.current
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
        <Link
          to="/configuracion"
          className={`flex flex-col items-center p-2 min-w-0 flex-1 text-center ${
            location.pathname.startsWith('/configuracion')
              ? 'text-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium truncate">Más</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNavigation;