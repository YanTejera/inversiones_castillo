import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { permisosService } from '../services/permisosService';
import type { PermisosUsuario, PermisoInfo } from '../services/permisosService';
import { authService } from '../services/authService';

interface PermisosContextType {
  permisos: string[];
  permisosPorCategoria: { [categoria: string]: PermisoInfo[] };
  rol: string;
  esMaster: boolean;
  esAdmin: boolean;
  loading: boolean;
  error: string | null;
  tienePermiso: (codigo: string) => boolean;
  tieneAlgunPermiso: (codigos: string[]) => boolean;
  tieneTodosPermisos: (codigos: string[]) => boolean;
  recargarPermisos: () => Promise<void>;
}

const PermisosContext = createContext<PermisosContextType | undefined>(undefined);

interface PermisosProviderProps {
  children: ReactNode;
}

export const PermisosProvider: React.FC<PermisosProviderProps> = ({ children }) => {
  const [permisos, setPermisos] = useState<string[]>([]);
  const [permisosPorCategoria, setPermisosPorCategoria] = useState<{ [categoria: string]: PermisoInfo[] }>({});
  const [rol, setRol] = useState<string>('');
  const [esMaster, setEsMaster] = useState<boolean>(false);
  const [esAdmin, setEsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar que tenemos token antes de hacer la petición
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay token, saltando carga de permisos');
        setPermisos([]);
        setPermisosPorCategoria({});
        setRol('');
        setEsMaster(false);
        setEsAdmin(false);
        setLoading(false);
        return;
      }
      
      const response = await permisosService.getPermisosUsuario();
      
      setPermisos(response.permisos);
      setPermisosPorCategoria(response.permisos_por_categoria);
      setRol(response.rol);
      setEsMaster(response.es_master);
      setEsAdmin(response.es_admin);
      
      console.log('Permisos cargados:', {
        permisos: response.permisos,
        rol: response.rol,
        esMaster: response.es_master,
        esAdmin: response.es_admin
      });
    } catch (err: any) {
      console.error('Error cargando permisos:', err);
      
      // Si es error de autenticación, no mostrar como error crítico
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Error de autenticación, limpiando permisos');
        setError(null);
      } else {
        setError(err.response?.data?.error || err.message || 'Error al cargar permisos');
      }
      
      // En caso de error, limpiar permisos
      setPermisos([]);
      setPermisosPorCategoria({});
      setRol('');
      setEsMaster(false);
      setEsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const recargarPermisos = async () => {
    await cargarPermisos();
  };

  const tienePermiso = (codigo: string): boolean => {
    if (esMaster) return true; // Master tiene todos los permisos
    return permisos.includes(codigo);
  };

  const tieneAlgunPermiso = (codigos: string[]): boolean => {
    if (esMaster) return true; // Master tiene todos los permisos
    return codigos.some(codigo => permisos.includes(codigo));
  };

  const tieneTodosPermisos = (codigos: string[]): boolean => {
    if (esMaster) return true; // Master tiene todos los permisos
    return codigos.every(codigo => permisos.includes(codigo));
  };

  useEffect(() => {
    // Inicialización más simple para evitar errores de carga
    const initPermisos = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = authService.getCurrentUser();
        const permisosLS = authService.getPermisos();
        const permisosCategoriaLS = authService.getPermisosPorCategoria();
        
        if (user && permisosLS.length > 0) {
          // Usar datos del localStorage si están disponibles
          setPermisos(permisosLS);
          setPermisosPorCategoria(permisosCategoriaLS);
          setRol(user.rol_info?.nombre_rol_display || '');
          setEsMaster(user.es_master || false);
          setEsAdmin(user.es_admin || false);
          setLoading(false);
          
          console.log('Permisos cargados desde localStorage');
        } else {
          // Cargar desde API si no hay datos locales
          await cargarPermisos();
        }
      } catch (error) {
        console.error('Error en inicialización de permisos:', error);
        setLoading(false);
      }
    };

    initPermisos();
  }, []);

  // Actualizar permisos cuando cambie el token
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          cargarPermisos();
        } else {
          // Token removido, limpiar permisos
          setPermisos([]);
          setPermisosPorCategoria({});
          setRol('');
          setEsMaster(false);
          setEsAdmin(false);
          setLoading(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const contextValue: PermisosContextType = {
    permisos,
    permisosPorCategoria,
    rol,
    esMaster,
    esAdmin,
    loading,
    error,
    tienePermiso,
    tieneAlgunPermiso,
    tieneTodosPermisos,
    recargarPermisos
  };

  return (
    <PermisosContext.Provider value={contextValue}>
      {children}
    </PermisosContext.Provider>
  );
};

export const usePermisos = (): PermisosContextType => {
  const context = useContext(PermisosContext);
  if (context === undefined) {
    throw new Error('usePermisos debe ser usado dentro de un PermisosProvider');
  }
  return context;
};

// Componente de alto orden para proteger rutas
export const ConPermiso: React.FC<{
  codigo?: string;
  codigos?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ codigo, codigos, requireAll = false, children, fallback = null }) => {
  const { tienePermiso, tieneAlgunPermiso, tieneTodosPermisos, loading, esMaster } = usePermisos();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Master siempre tiene acceso
  if (esMaster) {
    return <>{children}</>;
  }

  let tieneAcceso = false;

  if (codigo) {
    tieneAcceso = tienePermiso(codigo);
  } else if (codigos) {
    tieneAcceso = requireAll
      ? tieneTodosPermisos(codigos)
      : tieneAlgunPermiso(codigos);
  }

  return tieneAcceso ? <>{children}</> : <>{fallback}</>;
};

// Hook para verificar permisos específicos
export const usePermiso = (codigo: string) => {
  const { tienePermiso, loading, esMaster } = usePermisos();
  return {
    tienePermiso: tienePermiso(codigo),
    loading,
    esMaster
  };
};

// Hook para verificar múltiples permisos
export const useMultiplesPermisos = (codigos: string[], requireAll = false) => {
  const { tieneAlgunPermiso, tieneTodosPermisos, loading, esMaster } = usePermisos();
  return {
    tienePermiso: requireAll ? tieneTodosPermisos(codigos) : tieneAlgunPermiso(codigos),
    loading,
    esMaster
  };
};

export default PermisosContext;