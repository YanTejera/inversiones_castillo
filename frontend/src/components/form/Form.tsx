import React from 'react';
import { Save, X, RefreshCw } from 'lucide-react';

export interface FormAction {
  type: 'submit' | 'button' | 'reset';
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: FormAction[];
  isSubmitting?: boolean;
  className?: string;
  showDefaultActions?: boolean;
  cancelLabel?: string;
  submitLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
}

const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  title,
  description,
  actions,
  isSubmitting = false,
  className = '',
  showDefaultActions = true,
  cancelLabel = 'Cancelar',
  submitLabel = 'Guardar',
  onCancel,
  loading = false
}) => {
  const getButtonVariantClasses = (variant: FormAction['variant'] = 'primary') => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    }
  };

  const renderAction = (action: FormAction, index: number) => {
    const baseClasses = `
      px-4 py-2 rounded-md text-sm font-medium
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-200
      flex items-center gap-2
      btn-press micro-scale
    `;

    const variantClasses = getButtonVariantClasses(action.variant);

    if (action.type === 'submit') {
      return (
        <button
          key={index}
          type="submit"
          disabled={action.disabled || isSubmitting}
          className={`${baseClasses} ${variantClasses}`}
        >
          {(action.loading || isSubmitting) ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : action.icon}
          {action.label}
        </button>
      );
    }

    return (
      <button
        key={index}
        type={action.type}
        disabled={action.disabled}
        onClick={action.onClick}
        className={`${baseClasses} ${variantClasses}`}
      >
        {action.loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : action.icon}
        {action.label}
      </button>
    );
  };

  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="border-b border-gray-200 pb-4">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {loading && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {children}
      </div>

      {/* Actions */}
      {(showDefaultActions || actions) && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {/* Custom Actions */}
          {actions?.map(renderAction)}
          
          {/* Default Actions */}
          {showDefaultActions && !actions && (
            <>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                           disabled:opacity-50 disabled:cursor-not-allowed btn-press micro-scale
                           flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {cancelLabel}
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed btn-press micro-glow
                         flex items-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? 'Guardando...' : submitLabel}
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
};

export default Form;