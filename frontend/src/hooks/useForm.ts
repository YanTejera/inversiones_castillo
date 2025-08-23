import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../components/Toast';

export interface ValidationRule<T = any> {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: T) => string | null;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface FormErrors {
  [key: string]: string;
}

export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: ValidationSchema;
  onSubmit?: (values: T) => Promise<void> | void;
  onSuccess?: (values: T) => void;
  onError?: (error: Error) => void;
  resetOnSuccess?: boolean;
  enableRealTimeValidation?: boolean;
  autoFocus?: boolean;
  debounceMs?: number;
}

export interface UseFormReturn<T> {
  values: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  touched: { [K in keyof T]?: boolean };
  
  // Methods
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  validateField: (field: keyof T) => string | null;
  validateForm: () => boolean;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: (newValues?: Partial<T>) => void;
  
  // Refs for auto-focus
  getFieldRef: (field: keyof T) => React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
}

export const useForm = <T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> => {
  const {
    initialValues,
    validationSchema = {},
    onSubmit,
    onSuccess,
    onError,
    resetOnSuccess = true,
    enableRealTimeValidation = false,
    autoFocus = true,
    debounceMs = 300
  } = options;

  const { success, error: showError } = useToast();
  
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ [K in keyof T]?: boolean }>({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Refs for form fields
  const fieldRefs = useRef<{ [K in keyof T]?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> }>({});
  const debounceTimers = useRef<{ [K in keyof T]?: NodeJS.Timeout }>({});

  // Auto-focus first field when component mounts
  useEffect(() => {
    if (autoFocus) {
      const firstField = Object.keys(initialValues)[0] as keyof T;
      if (firstField && fieldRefs.current[firstField]?.current) {
        fieldRefs.current[firstField]!.current!.focus();
      }
    }
  }, [autoFocus, initialValues]);

  // Get or create field ref
  const getFieldRef = useCallback((field: keyof T) => {
    if (!fieldRefs.current[field]) {
      fieldRefs.current[field] = { current: null } as React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
    }
    return fieldRefs.current[field]!;
  }, []);

  // Validation function for a single field
  const validateField = useCallback((field: keyof T): string | null => {
    const value = values[field];
    const rules = validationSchema[field as string];
    
    if (!rules) return null;

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return rules.message || `${String(field)} es requerido`;
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return rules.message || `${String(field)} tiene un formato inválido`;
    }

    // Length validations for strings
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return rules.message || `${String(field)} debe tener al menos ${rules.minLength} caracteres`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return rules.message || `${String(field)} no puede tener más de ${rules.maxLength} caracteres`;
      }
    }

    // Numeric validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return rules.message || `${String(field)} debe ser al menos ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return rules.message || `${String(field)} no puede ser mayor que ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }, [values, validationSchema]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isFormValid = true;

    Object.keys(validationSchema).forEach(field => {
      const error = validateField(field as keyof T);
      if (error) {
        newErrors[field] = error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [validateField, validationSchema]);

  // Set a single value
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => {
      const newValues = { ...prev, [field]: value };
      setIsDirty(JSON.stringify(newValues) !== JSON.stringify(initialValues));
      return newValues;
    });

    // Real-time validation with debounce
    if (enableRealTimeValidation) {
      // Clear existing timer
      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
      }

      // Set new timer
      debounceTimers.current[field] = setTimeout(() => {
        const error = validateField(field);
        setErrors(prev => ({
          ...prev,
          [field]: error || undefined
        }));
      }, debounceMs);
    }
  }, [initialValues, enableRealTimeValidation, validateField, debounceMs]);

  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => {
      const updatedValues = { ...prev, ...newValues };
      setIsDirty(JSON.stringify(updatedValues) !== JSON.stringify(initialValues));
      return updatedValues;
    });
  }, [initialValues]);

  // Set error for a field
  const setError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  // Clear error for a field
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Handle input change
  const handleChange = useCallback((field: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = e.target;
      let value: any = target.value;

      // Handle different input types
      if (target.type === 'checkbox') {
        value = (target as HTMLInputElement).checked;
      } else if (target.type === 'number') {
        value = target.value === '' ? '' : Number(target.value);
      } else if (target.type === 'file') {
        value = (target as HTMLInputElement).files;
      }

      setValue(field, value);
    };
  }, [setValue]);

  // Handle input blur
  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      
      // Validate field on blur if real-time validation is disabled
      if (!enableRealTimeValidation) {
        const error = validateField(field);
        if (error) {
          setError(field, error);
        } else {
          clearError(field);
        }
      }
    };
  }, [enableRealTimeValidation, validateField, setError, clearError]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Mark all fields as touched
    const allTouched = Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as { [K in keyof T]: boolean });
    setTouched(allTouched);

    // Validate form
    const isFormValid = validateForm();
    
    if (!isFormValid) {
      showError('Por favor corrige los errores en el formulario');
      // Focus first field with error
      const firstErrorField = Object.keys(errors)[0] as keyof T;
      if (firstErrorField && fieldRefs.current[firstErrorField]?.current) {
        fieldRefs.current[firstErrorField]!.current!.focus();
      }
      return;
    }

    if (!onSubmit) return;

    try {
      setIsSubmitting(true);
      await onSubmit(values);
      
      success('Operación completada exitosamente');
      onSuccess?.(values);
      
      if (resetOnSuccess) {
        reset();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      showError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, 
    validateForm, 
    onSubmit, 
    values, 
    errors, 
    showError, 
    success, 
    onSuccess, 
    onError, 
    resetOnSuccess, 
    initialValues
  ]);

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = { ...initialValues, ...newValues };
    setValuesState(resetValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    
    // Clear debounce timers
    Object.values(debounceTimers.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    debounceTimers.current = {};
  }, [initialValues]);

  // Computed values
  const isValid = Object.keys(errors).length === 0;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    isValid,
    isDirty,
    touched,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    validateField,
    validateForm,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldRef
  };
};