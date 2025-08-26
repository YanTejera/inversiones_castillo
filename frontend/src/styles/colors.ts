// Sistema de colores mejorado para mejor contraste y legibilidad

export const colors = {
  // Fondos
  background: {
    primary: 'bg-white',
    primaryHover: 'bg-slate-50',
    secondary: 'bg-slate-50', // Más contrastado que gray-50
    tertiary: 'bg-slate-100', // Para tarjetas internas
    accent: 'bg-blue-50',
    accentHover: 'bg-blue-100',
    success: 'bg-emerald-50',
    warning: 'bg-amber-50',
    danger: 'bg-red-50',
    surface: 'bg-white' // Para dropdowns y modales
  },
  
  // Bordes más definidos y visibles
  border: {
    light: 'border-slate-300', // Más oscuro para mejor visibilidad
    medium: 'border-slate-400',
    strong: 'border-slate-500',
    accent: 'border-blue-300',
    success: 'border-emerald-300',
    warning: 'border-amber-300',
    danger: 'border-red-300'
  },
  
  // Bordes con grosor específico
  borderWidth: {
    thin: 'border-2',     // Mínimo 2px
    medium: 'border-3',   // 3px para separación clara
    thick: 'border-4',    // 4px para elementos importantes
    heavy: 'border-8'     // 8px para separadores principales
  },
  
  // Textos con mejor contraste
  text: {
    primary: 'text-slate-900', // Negro más suave
    secondary: 'text-slate-700', // Gris medio con buen contraste
    tertiary: 'text-slate-500', // Para texto terciario
    muted: 'text-slate-500', // Para texto secundario
    light: 'text-slate-400', // Para placeholders
    white: 'text-white', // Texto blanco
    accent: 'text-blue-700',
    accentHover: 'text-blue-800',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700'
  },
  
  // Estados hover mejorados
  hover: {
    light: 'hover:bg-slate-100',
    medium: 'hover:bg-slate-200',
    accent: 'hover:bg-blue-100',
    success: 'hover:bg-emerald-100',
    warning: 'hover:bg-amber-100',
    danger: 'hover:bg-red-100'
  },
  
  // Badges y estados con más contraste
  badge: {
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200'
  }
};

// Clases utilitarias para componentes comunes
export const componentStyles = {
  // Modales con bordes más gruesos
  modalOverlay: 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50',
  modalContainer: 'bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border-4 border-slate-400',
  modalHeader: 'flex items-center justify-between p-6 border-b-4 border-slate-300 bg-slate-50',
  modalContent: 'p-6 overflow-y-auto',
  
  // Tarjetas con bordes más gruesos
  cardPrimary: 'bg-white rounded-lg shadow-lg border-4 border-slate-300 p-6',
  cardSecondary: 'bg-slate-50 rounded-lg border-3 border-slate-300 p-4',
  cardAccent: 'bg-blue-50 rounded-lg border-3 border-blue-300 p-4',
  
  // Separadores principales
  dividerPrimary: 'border-t-4 border-slate-400 my-6',
  dividerSecondary: 'border-t-3 border-slate-300 my-4',
  dividerLight: 'border-t-2 border-slate-200 my-3',
  
  // Pestañas mejoradas
  tabActive: 'border-b-4 border-blue-600 text-blue-700 bg-blue-50 font-semibold',
  tabInactive: 'border-b-4 border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium',
  
  // Botones
  buttonPrimary: 'bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700',
  buttonSecondary: 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200 hover:border-slate-400',
  buttonDanger: 'bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 hover:border-red-700',
  
  // Inputs
  input: 'border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-slate-900',
  
  // Separadores más visibles
  divider: 'border-t-2 border-slate-200',
  
  // Sombras mejoradas
  shadowLight: 'shadow-md shadow-slate-200/50',
  shadowMedium: 'shadow-lg shadow-slate-300/50',
  shadowStrong: 'shadow-xl shadow-slate-400/30'
};

// Estados específicos para diferentes tipos de contenido
export const statusColors = {
  venta: {
    activa: colors.badge.warning,
    finalizada: colors.badge.success,
    cancelada: colors.badge.danger
  },
  pago: {
    pendiente: colors.badge.warning,
    pagado: colors.badge.success,
    atrasado: colors.badge.danger,
    parcial: colors.badge.info
  },
  cliente: {
    activo: colors.badge.success,
    inactivo: colors.badge.neutral,
    moroso: colors.badge.danger
  }
};