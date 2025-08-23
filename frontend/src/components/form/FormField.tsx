import React from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'date' | 'datetime-local' | 'file';
  error?: string;
  touched?: boolean;
  icon?: React.ReactNode;
  options?: { value: string; label: string }[];
  rows?: number;
  helpText?: string;
  showError?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  fieldRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  error,
  touched,
  icon,
  options = [],
  rows = 3,
  helpText,
  showError = true,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  fieldRef,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const hasError = error && touched && showError;

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-colors duration-200
    ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
    ${icon ? 'pl-10' : ''}
    ${type === 'password' ? 'pr-10' : ''}
    ${inputClassName}
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
            name={name}
            rows={rows}
            className={`${baseInputClasses} resize-none`}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        );

      case 'select':
        return (
          <select
            ref={fieldRef as React.RefObject<HTMLSelectElement>}
            name={name}
            className={baseInputClasses}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            <option value="">Seleccionar...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            ref={fieldRef as React.RefObject<HTMLInputElement>}
            name={name}
            type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
            className={baseInputClasses}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        );
    }
  };

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {/* Label */}
      <label 
        htmlFor={name} 
        className={`block text-sm font-medium text-gray-700 ${labelClassName}`}
      >
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-gray-400'}`}>
              {icon}
            </div>
          </div>
        )}

        {/* Input Field */}
        {renderInput()}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}

        {/* Error Icon */}
        {hasError && type !== 'password' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && !hasError && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {/* Error Message */}
      {hasError && showError && (
        <p className={`text-xs text-red-600 flex items-center gap-1 ${errorClassName}`}>
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;