// Export core services that are commonly used
export * from './api';
export * from './authService';
export * from './usuarioService';
export * from './motoService';
export * from './motoModeloService';
export * from './ventaService';
export * from './clienteService';
export * from './empleadoService';
export * from './asistenciaService';
export * from './financingService';
export * from './solicitudesService';

// Import and re-export as named exports for easier consumption
import { authService } from './authService';
import { usuarioService } from './usuarioService';
import { motoService } from './motoService';
import { motoModeloService } from './motoModeloService';
import { ventaService } from './ventaService';
import { clienteService } from './clienteService';
import { empleadoService } from './empleadoService';
import { asistenciaService } from './asistenciaService';
import { financingService } from './financingService';
import { solicitudesService } from './solicitudesService';

export {
  authService,
  usuarioService,
  motoService,
  motoModeloService,
  ventaService,
  clienteService,
  empleadoService,
  asistenciaService,
  financingService,
  solicitudesService
};