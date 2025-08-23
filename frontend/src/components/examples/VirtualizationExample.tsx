import React, { useState, useMemo } from 'react';
import { User, Calendar, DollarSign, Phone, MapPin } from 'lucide-react';
import VirtualTable, { VirtualTableColumn } from '../VirtualTable';
import VirtualList, { useVirtualList } from '../VirtualList';

// Sample data types
interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  ciudad: string;
  saldoPendiente: number;
  fechaRegistro: string;
  estado: 'activo' | 'inactivo';
}

// Generate sample data
const generateSampleData = (count: number): Cliente[] => {
  const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Miguel', 'Carmen', 'José', 'Isabella'];
  const apellidos = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Torres'];
  const ciudades = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Ibagué'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    nombre: nombres[Math.floor(Math.random() * nombres.length)],
    apellido: apellidos[Math.floor(Math.random() * apellidos.length)],
    cedula: `${Math.floor(Math.random() * 90000000) + 10000000}`,
    telefono: `300${Math.floor(Math.random() * 9000000) + 1000000}`,
    email: `usuario${index + 1}@email.com`,
    ciudad: ciudades[Math.floor(Math.random() * ciudades.length)],
    saldoPendiente: Math.floor(Math.random() * 5000000),
    fechaRegistro: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estado: Math.random() > 0.2 ? 'activo' : 'inactivo' as const
  }));
};

const VirtualizationExample: React.FC = () => {
  const [dataSize, setDataSize] = useState(10000);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');

  // Generate data
  const data = useMemo(() => generateSampleData(dataSize), [dataSize]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortBy as keyof Cliente];
      const bValue = b[sortBy as keyof Cliente];
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, sortDirection]);

  // Table columns configuration
  const columns: VirtualTableColumn<Cliente>[] = [
    {
      key: 'id',
      title: 'ID',
      width: 80,
      sortable: true,
      align: 'center'
    },
    {
      key: 'nombre',
      title: 'Nombre',
      width: 120,
      sortable: true,
      render: (_, record) => `${record.nombre} ${record.apellido}`
    },
    {
      key: 'cedula',
      title: 'Cédula',
      width: 120,
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs">{value}</span>
      )
    },
    {
      key: 'telefono',
      title: 'Teléfono',
      width: 120,
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <Phone className="h-3 w-3 mr-1 text-gray-400" />
          <span className="font-mono text-xs">{value}</span>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      width: 180,
      render: (value) => (
        <span className="text-xs text-blue-600 truncate">{value}</span>
      )
    },
    {
      key: 'ciudad',
      title: 'Ciudad',
      width: 100,
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <MapPin className="h-3 w-3 mr-1 text-gray-400" />
          <span className="text-xs">{value}</span>
        </div>
      )
    },
    {
      key: 'saldoPendiente',
      title: 'Saldo',
      width: 120,
      sortable: true,
      align: 'right',
      render: (value) => (
        <div className="flex items-center justify-end">
          <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
          <span className={`text-xs font-medium ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${value.toLocaleString()}
          </span>
        </div>
      )
    },
    {
      key: 'fechaRegistro',
      title: 'Registro',
      width: 100,
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
          <span className="text-xs">{value}</span>
        </div>
      )
    },
    {
      key: 'estado',
      title: 'Estado',
      width: 80,
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'activo' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  // Virtual list controls
  const virtualListControls = useVirtualList(sortedData.length, {
    itemHeight: 60,
    containerHeight: 500
  });

  // Handle table sort
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortDirection(direction);
  };

  // Render list item for virtual list
  const renderListItem = (cliente: Cliente, index: number, isVisible: boolean) => {
    const isSelected = selectedRows.includes(index);
    
    return (
      <div 
        className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50' : 'bg-white'
        }`}
        onClick={() => {
          const newSelection = isSelected 
            ? selectedRows.filter(i => i !== index)
            : [...selectedRows, index];
          setSelectedRows(newSelection);
        }}
      >
        {isVisible ? (
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {cliente.nombre} {cliente.apellido}
                </p>
                <p className="text-sm text-gray-500">ID: {cliente.id}</p>
              </div>
              
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-xs text-gray-500">{cliente.email}</p>
                <p className="text-xs text-gray-500">{cliente.telefono}</p>
                <p className="text-xs text-gray-500">{cliente.ciudad}</p>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  cliente.estado === 'activo' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {cliente.estado}
                </span>
                
                {cliente.saldoPendiente > 0 && (
                  <span className="text-xs font-medium text-red-600">
                    Debe: ${cliente.saldoPendiente.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Skeleton for non-visible items
          <div className="animate-pulse flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Virtualización de Listas
        </h1>
        <p className="text-gray-600">
          Rendimiento optimizado para listas con miles de elementos
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad de registros
              </label>
              <select
                value={dataSize}
                onChange={(e) => {
                  setDataSize(Number(e.target.value));
                  setSelectedRows([]);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={100}>100 registros</option>
                <option value={1000}>1,000 registros</option>
                <option value={10000}>10,000 registros</option>
                <option value={50000}>50,000 registros</option>
                <option value={100000}>100,000 registros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modo de vista
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lista
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'list' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={virtualListControls.scrollToTop}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ir al inicio
              </button>
              <button
                onClick={virtualListControls.scrollToBottom}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ir al final
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Rendimiento</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{sortedData.length.toLocaleString()}</div>
            <div className="text-sm text-blue-800">Total de registros</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {viewMode === 'table' ? '~15' : '~8'}
            </div>
            <div className="text-sm text-green-800">Elementos renderizados</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{selectedRows.length}</div>
            <div className="text-sm text-purple-800">Elementos seleccionados</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {((15 / sortedData.length) * 100).toFixed(3)}%
            </div>
            <div className="text-sm text-orange-800">% DOM utilizado</div>
          </div>
        </div>
      </div>

      {/* Virtual Data Display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === 'table' ? 'Tabla Virtual' : 'Lista Virtual'}
          </h2>
          <p className="text-sm text-gray-600">
            Solo se renderizan los elementos visibles para máximo rendimiento
          </p>
        </div>

        {viewMode === 'table' ? (
          <VirtualTable
            data={sortedData}
            columns={columns}
            height={500}
            rowHeight={50}
            headerHeight={40}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            selectedRows={selectedRows}
            onRowSelect={setSelectedRows}
            getRowKey={(record) => record.id}
            rowClassName={(record) => 
              record.saldoPendiente > 2000000 ? 'bg-red-50' : ''
            }
          />
        ) : (
          <VirtualList
            items={sortedData}
            itemHeight={60}
            containerHeight={500}
            renderItem={renderListItem}
            getItemKey={(record) => record.id}
            overscan={3}
          />
        )}
      </div>

      {/* Benefits */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Beneficios de la Virtualización</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Sin Virtualización</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Renderiza todos los {sortedData.length.toLocaleString()} elementos</li>
              <li>• Alto uso de memoria RAM</li>
              <li>• Scroll lento con muchos elementos</li>
              <li>• Tiempo de carga inicial alto</li>
              <li>• Posible congelamiento del navegador</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-green-800 mb-2">Con Virtualización</h3>
            <ul className="text-sm text-green-600 space-y-1">
              <li>• Solo renderiza elementos visibles (~15)</li>
              <li>• Uso mínimo de memoria</li>
              <li>• Scroll fluido independiente del tamaño</li>
              <li>• Carga instantánea</li>
              <li>• Rendimiento constante</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualizationExample;