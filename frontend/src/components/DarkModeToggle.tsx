import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface DarkModeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  className = '', 
  showLabel = false,
  size = 'md'
}) => {
  const { isDarkMode, toggleDarkMode, loading } = useTheme();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Modo {isDarkMode ? 'oscuro' : 'claro'}
        </span>
      )}
      
      <button
        onClick={toggleDarkMode}
        disabled={loading}
        className={`
          relative inline-flex items-center justify-center rounded-lg
          transition-all duration-200 ease-in-out
          bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
          text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100
          border border-gray-200 dark:border-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${buttonSizeClasses[size]}
        `}
        title={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
      >
        <div className="relative">
          {loading ? (
            <div className={`${sizeClasses[size]} animate-spin`}>
              <div className="h-full w-full border-2 border-gray-400 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <Sun 
                className={`
                  ${sizeClasses[size]} transition-all duration-300 ease-in-out
                  ${isDarkMode ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
                  absolute inset-0
                `} 
              />
              <Moon 
                className={`
                  ${sizeClasses[size]} transition-all duration-300 ease-in-out
                  ${isDarkMode ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                  absolute inset-0
                `} 
              />
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default DarkModeToggle;