import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye
} from 'lucide-react';
import { clienteService } from '../services/clienteService';
import ClienteForm from '../components/ClienteForm';
import type { Cliente } from '../types';

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');

  const loadClientes = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await clienteService.getClientes(page, search);
      setClientes(response.results);
      setTotalPages(Math.ceil(response.count / 20)); // Asumiendo 20 items por página
    } catch (err) {
      setError('Error al cargar clientes');
      console.error('Error loading clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadClientes(1, searchTerm);
  };

  const handleDelete = async (cliente: Cliente) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente ${cliente.nombre} ${cliente.apellido}?`)) {
      try {
        await clienteService.deleteCliente(cliente.id);
        loadClientes(currentPage, searchTerm);
      } catch (err) {
        alert('Error al eliminar cliente');
        console.error('Error deleting cliente:', err);
      }
    }
  };

  const openModal = (mode: 'view' | 'create' | 'edit', cliente?: Cliente) => {
    setModalMode(mode);
    setSelectedCliente(cliente || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCliente(null);
  };

  const handleFormSave = () => {
    loadClientes(currentPage, searchTerm);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra la información de todos tus clientes
            </p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Buscar
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Clientes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {cliente.nombre} {cliente.apellido}
                  </h3>
                  <p className="text-sm text-gray-500">CC: {cliente.cedula}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {cliente.telefono && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {cliente.telefono}
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {cliente.email}
                </div>
              )}
              {cliente.direccion && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {cliente.direccion}
                </div>
              )}
              {cliente.fecha_nacimiento && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(cliente.fecha_nacimiento)}
                </div>
              )}
            </div>

            {cliente.ingresos && (
              <div className="mb-4">
                <span className="text-sm font-medium text-green-600">
                  Ingresos: {formatCurrency(cliente.ingresos)}
                </span>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => openModal('view', cliente)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => openModal('edit', cliente)}
                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(cliente)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {clientes.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron clientes con esa búsqueda.' : 'Comienza creando tu primer cliente.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => openModal('create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Nuevo Cliente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Cliente Form Modal */}
      {showModal && (
        <ClienteForm
          cliente={selectedCliente}
          mode={modalMode}
          onClose={closeModal}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
};

export default Clientes;