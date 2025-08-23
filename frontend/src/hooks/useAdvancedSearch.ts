import { useState, useCallback, useMemo, useEffect } from 'react';

// Define types locally to avoid import issues
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

export interface UseAdvancedSearchOptions {
  initialSearchTerm?: string;
  initialFilters?: SearchFilters;
  debounceMs?: number;
  persistKey?: string; // Para guardar en localStorage
}

export interface UseAdvancedSearchReturn {
  searchTerm: string;
  filters: SearchFilters;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: SearchFilters) => void;
  updateFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearAll: () => void;
  debouncedSearchTerm: string;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

export const useAdvancedSearch = (
  options: UseAdvancedSearchOptions = {}
): UseAdvancedSearchReturn => {
  const {
    initialSearchTerm = '',
    initialFilters = {},
    debounceMs = 300,
    persistKey
  } = options;

  // Cargar estado inicial desde localStorage si se especifica
  const getInitialState = useCallback(() => {
    if (persistKey) {
      try {
        const saved = localStorage.getItem(`search_${persistKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            searchTerm: parsed.searchTerm || initialSearchTerm,
            filters: parsed.filters || initialFilters
          };
        }
      } catch (error) {
        console.warn('Error loading search state from localStorage:', error);
      }
    }
    return {
      searchTerm: initialSearchTerm,
      filters: initialFilters
    };
  }, [initialSearchTerm, initialFilters, persistKey]);

  const initialState = getInitialState();
  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm);
  const [filters, setFilters] = useState<SearchFilters>(initialState.filters);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialState.searchTerm);

  // Debounce del término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Persistir en localStorage cuando cambie el estado
  useEffect(() => {
    if (persistKey) {
      try {
        const stateToSave = {
          searchTerm,
          filters
        };
        localStorage.setItem(`search_${persistKey}`, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Error saving search state to localStorage:', error);
      }
    }
  }, [searchTerm, filters, persistKey]);

  // Actualizar un filtro específico
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (value === '' || value === null || value === undefined || 
          (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      
      return newFilters;
    });
  }, []);

  // Remover un filtro específico
  const removeFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  // Limpiar todo
  const clearAll = useCallback(() => {
    setSearchTerm('');
    setFilters({});
  }, []);

  // Métricas útiles
  const hasActiveFilters = useMemo(() => {
    return searchTerm.length > 0 || Object.keys(filters).length > 0;
  }, [searchTerm, filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).length;
  }, [filters]);

  return {
    searchTerm,
    filters,
    setSearchTerm,
    setFilters,
    updateFilter,
    removeFilter,
    clearAll,
    debouncedSearchTerm,
    hasActiveFilters,
    activeFiltersCount
  };
};

// Hook específico para filtrar datos localmente
export interface UseLocalSearchOptions<T> extends UseAdvancedSearchOptions {
  data: T[];
  searchFields: (keyof T)[];
  filterFunctions?: {
    [key: string]: (item: T, filterValue: any) => boolean;
  };
}

export const useLocalSearch = <T extends Record<string, any>>(
  options: UseLocalSearchOptions<T>
) => {
  const { data, searchFields, filterFunctions = {}, ...searchOptions } = options;
  const search = useAdvancedSearch(searchOptions);

  // Filtrar datos basándose en el término de búsqueda y filtros
  const filteredData = useMemo(() => {
    let result = [...data];

    // Aplicar búsqueda por texto
    if (search.debouncedSearchTerm) {
      const searchTerm = search.debouncedSearchTerm.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm);
        })
      );
    }

    // Aplicar filtros
    Object.entries(search.filters).forEach(([key, value]) => {
      if (filterFunctions[key]) {
        result = result.filter(item => filterFunctions[key](item, value));
      } else {
        // Filtro por defecto: comparación exacta
        result = result.filter(item => {
          const itemValue = item[key];
          
          // Manejar rangos de fechas
          if (Array.isArray(value) && value.length === 2) {
            const [start, end] = value;
            if (start && end) {
              const itemDate = new Date(itemValue);
              const startDate = new Date(start);
              const endDate = new Date(end);
              return itemDate >= startDate && itemDate <= endDate;
            } else if (start) {
              const itemDate = new Date(itemValue);
              const startDate = new Date(start);
              return itemDate >= startDate;
            } else if (end) {
              const itemDate = new Date(itemValue);
              const endDate = new Date(end);
              return itemDate <= endDate;
            }
          }
          
          // Manejar rangos numéricos
          if (Array.isArray(value) && value.length === 2) {
            const [min, max] = value;
            const numValue = Number(itemValue);
            if (min !== '' && max !== '') {
              return numValue >= Number(min) && numValue <= Number(max);
            } else if (min !== '') {
              return numValue >= Number(min);
            } else if (max !== '') {
              return numValue <= Number(max);
            }
          }
          
          // Comparación exacta por defecto
          return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });

    return result;
  }, [data, search.debouncedSearchTerm, search.filters, searchFields, filterFunctions]);

  return {
    ...search,
    filteredData,
    totalCount: data.length,
    filteredCount: filteredData.length
  };
};

// Hook para generar sugerencias automáticamente
export const useSearchSuggestions = <T extends Record<string, any>>(
  data: T[],
  searchFields: (keyof T)[],
  maxSuggestions: number = 10
): string[] => {
  return useMemo(() => {
    const suggestions = new Set<string>();
    
    data.forEach(item => {
      searchFields.forEach(field => {
        const value = item[field];
        if (value && typeof value === 'string' && value.trim()) {
          // Agregar valor completo
          suggestions.add(value.trim());
          
          // Agregar palabras individuales si es útil
          const words = value.trim().split(/\s+/);
          if (words.length > 1) {
            words.forEach(word => {
              if (word.length > 2) {
                suggestions.add(word);
              }
            });
          }
        }
      });
    });

    return Array.from(suggestions)
      .sort()
      .slice(0, maxSuggestions);
  }, [data, searchFields, maxSuggestions]);
};