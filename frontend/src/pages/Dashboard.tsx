import React, { useState, Suspense } from 'react';
import { 
  BarChart3,
  Zap,
  Settings
} from 'lucide-react';
import DashboardAdvanced from '../components/DashboardAdvanced';
import DashboardClassic from '../components/DashboardClassic';
import { useToast } from '../components/Toast';

const Dashboard: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();
  const [viewMode, setViewMode] = useState<'advanced' | 'classic'>('advanced');

  return (
    <div className="page-fade-in">
      {/* Toggle between Advanced and Classic */}
      <div className="mb-6 flex items-center justify-between animate-fade-in-up">
        <div className="flex bg-gray-100 rounded-lg p-1 micro-glow">
          <button
            onClick={() => setViewMode('advanced')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium btn-press micro-scale ${
              viewMode === 'advanced'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Zap className="h-4 w-4 mr-2" />
            Dashboard Avanzado
          </button>
          <button
            onClick={() => setViewMode('classic')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium btn-press micro-scale ${
              viewMode === 'classic'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Vista Clásica
          </button>
        </div>
      </div>

      {/* Render selected view */}
      <Suspense fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 staggered-fade-in">
            <div className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      }>
        {viewMode === 'advanced' ? (
          <DashboardAdvanced />
        ) : (
          <DashboardClassic />
        )}
      </Suspense>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};


export default Dashboard;