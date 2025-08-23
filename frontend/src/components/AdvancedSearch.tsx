import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  DollarSign,
  User,
  ShoppingCart,
  Bike,
  CreditCard,
  Package,
  FileText,
  Settings,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { useToast } from './Toast';
// Define types locally to avoid module resolution issues
interface SearchFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'numberRange' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
}

interface SearchFilters {
  [key: string]: any;
}

// Define props interface directly here to avoid export issues
interface AdvancedSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: SearchFilter[];
  activeFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  placeholder?: string;
  showAdvanced?: boolean;
  onReset?: () => void;
  loading?: boolean;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  activeFilters,
  onFiltersChange,
  suggestions = [],
  onSuggestionSelect,
  placeholder = "Buscar...",
  showAdvanced = true,
  onReset,
  loading = false,
  className = ""
}) => {
  const { info } = useToast();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Auto-focus en el campo de búsqueda
  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  // Filtrar sugerencias basadas en el término de búsqueda
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm || !suggestions.length) return [];
    const term = searchTerm.toLowerCase();
    return suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(term) && 
        suggestion.toLowerCase() !== term
      )
      .slice(0, 8); // Limitar a 8 sugerencias
  }, [searchTerm, suggestions]);

  // Manejar navegación por teclado en sugerencias
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedSuggestion(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedSuggestion(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedSuggestion >= 0) {
          const selectedSuggestion = filteredSuggestions[focusedSuggestion];
          onSearchChange(selectedSuggestion);
          onSuggestionSelect?.(selectedSuggestion);
          setShowSuggestions(false);
          setFocusedSuggestion(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedSuggestion(-1);
        break;
    }
  }, [showSuggestions, filteredSuggestions, focusedSuggestion, onSearchChange, onSuggestionSelect]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setFocusedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = useCallback((filterKey: string, value: any) => {
    const newFilters = { ...activeFilters };
    
    if (value === '' || value === null || value === undefined || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = value;
    }
    
    onFiltersChange(newFilters);
  }, [activeFilters, onFiltersChange]);

  const handleReset = useCallback(() => {
    onSearchChange('');
    onFiltersChange({});
    setIsAdvancedOpen(false);
    onReset?.();
    info('Filtros reiniciados');
  }, [onSearchChange, onFiltersChange, onReset, info]);

  const activeFiltersCount = Object.keys(activeFilters).length;
  const hasSearchTerm = searchTerm.length > 0;
  const hasActiveFilters = activeFiltersCount > 0 || hasSearchTerm;

  const renderFilterInput = (filter: SearchFilter) => {
    const value = activeFilters[filter.key] || '';

    switch (filter.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">{filter.placeholder || `Todos ${filter.label.toLowerCase()}`}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        );

      case 'dateRange':
        const [startDate, endDate] = Array.isArray(value) ? value : ['', ''];
        return (
          <div className="flex space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(filter.key, [e.target.value, endDate])}
              placeholder="Desde"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(filter.key, [startDate, e.target.value])}
              placeholder="Hasta"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        );

      case 'numberRange':
        const [minValue, maxValue] = Array.isArray(value) ? value : ['', ''];
        return (
          <div className="flex space-x-2">
            <input
              type="number"
              value={minValue}
              onChange={(e) => handleFilterChange(filter.key, [e.target.value, maxValue])}
              placeholder="Mínimo"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="number"
              value={maxValue}
              onChange={(e) => handleFilterChange(filter.key, [minValue, e.target.value])}
              placeholder="Máximo"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        );

      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">{filter.placeholder || 'Todos'}</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );

      default: // 'text'
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Barra de búsqueda principal */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Campo de búsqueda */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSuggestions(true);
                  setFocusedSuggestion(-1);
                }}
                onFocus={() => {
                  if (filteredSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {loading && (
                <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 animate-spin" />
              )}
            </div>

            {/* Sugerencias */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1"
              >
                {filteredSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    onClick={() => {
                      onSearchChange(suggestion);
                      onSuggestionSelect?.(suggestion);
                      setShowSuggestions(false);
                      setFocusedSuggestion(-1);
                    }}
                    className={`px-4 py-2 cursor-pointer text-sm ${
                      index === focusedSuggestion
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Search className="h-4 w-4 text-gray-400 mr-2" />
                      {suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center space-x-2">
            {showAdvanced && (
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium flex items-center space-x-2 hover:bg-gray-50 transition-colors ${
                  activeFiltersCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'text-gray-700'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {activeFiltersCount}
                  </span>
                )}
                {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}

            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center space-x-1 hover:bg-gray-50 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumen de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {hasSearchTerm && (
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <Search className="h-3 w-3 mr-1" />
                "{searchTerm}"
                <button
                  onClick={() => onSearchChange('')}
                  className="ml-2 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {Object.entries(activeFilters).map(([key, value]) => {
              const filter = filters.find(f => f.key === key);
              if (!filter) return null;

              let displayValue = value;
              if (filter.type === 'dateRange' || filter.type === 'numberRange') {
                const [start, end] = Array.isArray(value) ? value : ['', ''];
                displayValue = `${start || '...'} - ${end || '...'}`;
              } else if (filter.type === 'select' && filter.options) {
                const option = filter.options.find(opt => opt.value === value);
                displayValue = option ? option.label : value;
              } else if (filter.type === 'boolean') {
                displayValue = value === 'true' ? 'Sí' : 'No';
              }

              return (
                <div key={key} className="inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {filter.icon && <span className="mr-1">{filter.icon}</span>}
                  <span className="font-medium">{filter.label}:</span>
                  <span className="ml-1">{displayValue}</span>
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-2 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel de filtros avanzados */}
      {showAdvanced && isAdvancedOpen && (
        <div className="p-4 bg-gray-50 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  {filter.icon && <span className="mr-2">{filter.icon}</span>}
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;