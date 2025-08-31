import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  variant = 'rectangular',
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Tailwind doesn't have wave by default, using pulse
    none: ''
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Componentes de skeleton predefinidos para casos comunes
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700 ${className}`}>
    <Skeleton height="12rem" className="w-full" />
    <div className="p-4 space-y-3">
      <Skeleton height="1.5rem" width="75%" />
      <Skeleton height="1rem" width="50%" />
      <div className="flex justify-between items-center mt-4">
        <Skeleton height="1.25rem" width="30%" />
        <Skeleton height="2rem" width="20%" variant="rectangular" />
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 ${className}`}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="rectangular" width="4rem" height="4rem" />
      <div className="flex-1 space-y-2">
        <Skeleton height="1.25rem" width="60%" />
        <Skeleton height="1rem" width="40%" />
      </div>
      <div className="flex space-x-2">
        <Skeleton variant="rectangular" width="2rem" height="2rem" />
        <Skeleton variant="rectangular" width="2rem" height="2rem" />
        <Skeleton variant="rectangular" width="4rem" height="2rem" />
      </div>
    </div>
  </div>
);

export const SkeletonStats: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 ${className}`}>
    <Skeleton height="0.75rem" width="40%" className="mb-1" />
    <Skeleton height="1.5rem" width="25%" />
  </div>
);

export default Skeleton;