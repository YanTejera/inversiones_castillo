import React from 'react';
import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ 
  viewMode, 
  onViewModeChange, 
  className = '' 
}) => {
  return (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      <button
        onClick={() => onViewModeChange('grid')}
        className={`flex items-center px-3 py-1 rounded-md transition-colors duration-200 ${
          viewMode === 'grid'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
        title="Vista en grilla"
      >
        <Grid className="h-4 w-4" />
        <span className="ml-1 text-sm">Grilla</span>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`flex items-center px-3 py-1 rounded-md transition-colors duration-200 ${
          viewMode === 'list'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
        title="Vista en lista"
      >
        <List className="h-4 w-4" />
        <span className="ml-1 text-sm">Lista</span>
      </button>
    </div>
  );
};

export default ViewToggle;