import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usuarioService } from '../services/usuarioService';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Inicializar el tema basado en el usuario o localStorage
  useEffect(() => {
    const initializeTheme = async () => {
      const savedTheme = localStorage.getItem('darkMode');
      
      if (user && user.tema_oscuro !== undefined && user.tema_oscuro !== null) {
        // Usuario logueado con preferencia definida
        const userPreference = user.tema_oscuro;
        const localStoragePreference = savedTheme === 'true';
        
        // Si hay diferencia, priorizar localStorage (intención más reciente del usuario)
        if (savedTheme !== null && userPreference !== localStoragePreference) {
          // Usar la preferencia de localStorage
          setIsDarkMode(localStoragePreference);
          applyTheme(localStoragePreference);
          
          // Sincronizar con la base de datos en background
          try {
            await usuarioService.updateUserSettings({
              tema_oscuro: localStoragePreference
            });
          } catch (error) {
            console.error('Error syncing theme preference:', error);
          }
        } else {
          // Las preferencias coinciden o no hay localStorage, usar preferencia del usuario
          setIsDarkMode(userPreference);
          applyTheme(userPreference);
          localStorage.setItem('darkMode', userPreference.toString());
        }
      } else {
        // Sin usuario o sin preferencia definida, usar localStorage o sistema
        if (savedTheme !== null) {
          const isDark = savedTheme === 'true';
          setIsDarkMode(isDark);
          applyTheme(isDark);
        } else {
          // Usar preferencia del sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDarkMode(prefersDark);
          applyTheme(prefersDark);
          localStorage.setItem('darkMode', prefersDark.toString());
        }
      }
    };

    initializeTheme();
  }, [user]);

  // Aplicar el tema al DOM
  const applyTheme = (darkMode: boolean) => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Toggle del modo oscuro
  const toggleDarkMode = async () => {
    setLoading(true);
    const newMode = !isDarkMode;

    try {
      // Siempre actualizar localStorage para consistencia
      localStorage.setItem('darkMode', newMode.toString());
      
      if (user) {
        // Actualizar en el servidor si hay usuario logueado
        await usuarioService.updateUserSettings({
          tema_oscuro: newMode
        });
        // El useAuth se actualizará automáticamente
      }
      
      setIsDarkMode(newMode);
      applyTheme(newMode);
      
    } catch (error) {
      console.error('Error al cambiar tema:', error);
      // Revertir en caso de error
      localStorage.setItem('darkMode', (!newMode).toString());
      setIsDarkMode(!newMode);
      applyTheme(!newMode);
    } finally {
      setLoading(false);
    }
  };

  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
    loading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};