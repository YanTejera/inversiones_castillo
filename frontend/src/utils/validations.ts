import { ValidationRule } from '../hooks/useForm';

// Common validation patterns
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  cedula: /^\d{7,10}$/,
  nit: /^\d{8,15}(\-\d{1,2})?$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  url: /^https?:\/\/.+$/,
  postalCode: /^\d{5,6}$/,
  currency: /^\d+(\.\d{1,2})?$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  letters: /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/,
  numbers: /^\d+$/
};

// Common validation rules
export const RULES = {
  required: (): ValidationRule => ({
    required: true,
    message: 'Este campo es requerido'
  }),

  email: (required = false): ValidationRule => ({
    required,
    pattern: PATTERNS.email,
    message: 'Ingresa un email válido'
  }),

  phone: (required = false): ValidationRule => ({
    required,
    pattern: PATTERNS.phone,
    message: 'Ingresa un teléfono válido'
  }),

  cedula: (required = true): ValidationRule => ({
    required,
    pattern: PATTERNS.cedula,
    message: 'Ingresa una cédula válida (7-10 dígitos)'
  }),

  nit: (required = false): ValidationRule => ({
    required,
    pattern: PATTERNS.nit,
    message: 'Ingresa un NIT válido'
  }),

  password: (required = true): ValidationRule => ({
    required,
    pattern: PATTERNS.password,
    minLength: 8,
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'
  }),

  minLength: (min: number, required = false): ValidationRule => ({
    required,
    minLength: min,
    message: `Debe tener al menos ${min} caracteres`
  }),

  maxLength: (max: number, required = false): ValidationRule => ({
    required,
    maxLength: max,
    message: `No puede tener más de ${max} caracteres`
  }),

  minValue: (min: number, required = false): ValidationRule => ({
    required,
    min,
    message: `El valor debe ser al menos ${min}`
  }),

  maxValue: (max: number, required = false): ValidationRule => ({
    required,
    max,
    message: `El valor no puede ser mayor a ${max}`
  }),

  positive: (required = false): ValidationRule => ({
    required,
    min: 0.01,
    message: 'El valor debe ser positivo'
  }),

  url: (required = false): ValidationRule => ({
    required,
    pattern: PATTERNS.url,
    message: 'Ingresa una URL válida'
  }),

  letters: (required = false): ValidationRule => ({
    required,
    pattern: PATTERNS.letters,
    message: 'Solo se permiten letras y espacios'
  }),

  numbers: (required = false): ValidationRule => ({
    required,
    pattern: PATTERNS.numbers,
    message: 'Solo se permiten números'
  }),

  currency: (required = false, min?: number, max?: number): ValidationRule => ({
    required,
    pattern: PATTERNS.currency,
    min,
    max,
    message: 'Ingresa un monto válido'
  }),

  // Custom validators
  equalTo: (otherField: string, otherFieldLabel: string, required = false): ValidationRule => ({
    required,
    custom: (value, allValues) => {
      if (allValues && value !== allValues[otherField]) {
        return `Debe coincidir con ${otherFieldLabel}`;
      }
      return null;
    }
  }),

  dateInFuture: (required = false): ValidationRule => ({
    required,
    custom: (value) => {
      if (!value) return null;
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate <= today) {
        return 'La fecha debe ser futura';
      }
      return null;
    }
  }),

  dateInPast: (required = false): ValidationRule => ({
    required,
    custom: (value) => {
      if (!value) return null;
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate >= today) {
        return 'La fecha debe ser anterior a hoy';
      }
      return null;
    }
  }),

  ageRange: (minAge: number, maxAge: number, required = false): ValidationRule => ({
    required,
    custom: (value) => {
      if (!value) return null;
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      if (actualAge < minAge || actualAge > maxAge) {
        return `La edad debe estar entre ${minAge} y ${maxAge} años`;
      }
      return null;
    }
  }),

  uniqueEmail: (existingEmails: string[], required = false): ValidationRule => ({
    required,
    pattern: PATTERNS.email,
    custom: (value) => {
      if (!value) return null;
      if (existingEmails.includes(value.toLowerCase())) {
        return 'Este email ya está registrado';
      }
      return null;
    }
  }),

  uniqueCedula: (existingCedulas: string[], required = true): ValidationRule => ({
    required,
    pattern: PATTERNS.cedula,
    custom: (value) => {
      if (!value) return null;
      if (existingCedulas.includes(value)) {
        return 'Esta cédula ya está registrada';
      }
      return null;
    }
  })
};

// Pre-built validation schemas for common entities
export const VALIDATION_SCHEMAS = {
  cliente: {
    nombre: { ...RULES.required(), ...RULES.letters(true), minLength: 2, maxLength: 50 },
    apellido: { ...RULES.required(), ...RULES.letters(true), minLength: 2, maxLength: 50 },
    cedula: RULES.cedula(true),
    telefono: RULES.phone(true),
    email: RULES.email(false),
    direccion: { ...RULES.required(), minLength: 10, maxLength: 200 },
    ciudad: { ...RULES.required(), ...RULES.letters(true), minLength: 2, maxLength: 50 },
    fecha_nacimiento: RULES.ageRange(18, 100, false)
  },

  moto: {
    marca: { ...RULES.required(), ...RULES.letters(true), minLength: 2, maxLength: 50 },
    modelo: { ...RULES.required(), minLength: 2, maxLength: 50 },
    ano: { ...RULES.required(), min: 1990, max: new Date().getFullYear() + 1 },
    cilindraje: { ...RULES.required(), min: 50, max: 2000 },
    color: { ...RULES.required(), ...RULES.letters(true), minLength: 2, maxLength: 30 },
    numero_serie: { ...RULES.required(), minLength: 5, maxLength: 30 },
    numero_motor: { ...RULES.required(), minLength: 5, maxLength: 30 },
    precio_compra: RULES.currency(true, 100000),
    precio_venta: RULES.currency(true, 100000),
    kilometraje: { min: 0, max: 999999 }
  },

  venta: {
    monto_total: RULES.currency(true, 1),
    cuota_inicial: RULES.currency(false, 0),
    numero_cuotas: { min: 1, max: 60 },
    valor_cuota: RULES.currency(false, 1),
    tasa_interes: { min: 0, max: 100 },
    observaciones: { maxLength: 500 }
  },

  pago: {
    monto_pagado: RULES.currency(true, 1),
    numero_recibo: { ...RULES.required(), minLength: 3, maxLength: 20 },
    observaciones: { maxLength: 200 }
  },

  proveedor: {
    nombre: { ...RULES.required(), minLength: 2, maxLength: 100 },
    nit: RULES.nit(false),
    telefono: RULES.phone(true),
    email: RULES.email(false),
    direccion: { minLength: 10, maxLength: 200 },
    ciudad: { ...RULES.letters(true), minLength: 2, maxLength: 50 },
    contacto_principal: { ...RULES.letters(true), minLength: 2, maxLength: 50 }
  },

  usuario: {
    username: { ...RULES.required(), minLength: 3, maxLength: 30 },
    email: RULES.email(true),
    password: RULES.password(true),
    first_name: { ...RULES.required(), ...RULES.letters(true), minLength: 2, maxLength: 30 },
    last_name: { ...RULES.required(), ...RULES.letters(true), minLength: 2, maxLength: 30 }
  }
};

// Helper function to merge validation rules
export const mergeRules = (...rules: ValidationRule[]): ValidationRule => {
  return rules.reduce((merged, rule) => ({ ...merged, ...rule }), {});
};

// Helper function to create conditional validation
export const conditionalRule = (
  condition: (values: any) => boolean, 
  rule: ValidationRule
): ValidationRule => ({
  custom: (value, allValues) => {
    if (condition(allValues)) {
      // Apply the rule
      if (rule.required && (value === null || value === undefined || value === '')) {
        return rule.message || 'Este campo es requerido';
      }
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        return rule.message || 'Formato inválido';
      }
      if (rule.custom) {
        return rule.custom(value, allValues);
      }
    }
    return null;
  }
});