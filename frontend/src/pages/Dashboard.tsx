import React, { useState } from 'react';
import { 
  BarChart3,
  Zap,
  Settings
} from 'lucide-react';
import DashboardAdvanced from '../components/DashboardAdvanced';
import DashboardClassic from '../components/DashboardClassic';

const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'advanced' | 'classic'>('advanced');

  return (
    <div>
      {/* Toggle between Advanced and Classic */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('advanced')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
      {viewMode === 'advanced' ? (
        <DashboardAdvanced />
      ) : (
        <DashboardClassic />
      )}
    </div>
  );
};


export default Dashboard;