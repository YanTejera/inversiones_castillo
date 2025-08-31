#!/usr/bin/env python
"""
Script de inicio rápido para el servidor de desarrollo
Muestra información útil y ejecuta el servidor
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Función principal para iniciar el servidor con información"""
    
    # Verificar que estamos en el directorio correcto
    if not Path('manage.py').exists():
        print("[ERROR] Error: No se encontró manage.py")
        print("   Ejecuta este script desde el directorio backend")
        return
    
    # Mostrar banner inicial
    print("\n" + "[START]" + "="*70 + "[START]")
    print("                    INICIANDO SERVIDOR DE DESARROLLO")
    print("[START]" + "="*70 + "[START]")
    
    # Información de producción
    print("\n[INFO] INFORMACIÓN DE PRODUCCIÓN:")
    print("   Frontend:     https://inversiones-castillo-frontend.vercel.app")
    print("   Backend:      https://inversiones-castillo-backend.onrender.com")
    print("   Admin Panel:  https://inversiones-castillo-backend.onrender.com/admin/")
    print("\n[AUTH] CREDENCIALES:")
    print("   Usuario:      admin")
    print("   Contraseña:   admin123")
    
    # Información local
    print("\n[LOCAL] SERVIDOR LOCAL:")
    print("   Frontend:     http://localhost:5173")
    print("   Backend:      http://localhost:8000")
    print("   Admin:        http://localhost:8000/admin/")
    print("   API:          http://localhost:8000/api/")
    
    print("\n" + "="*80)
    print("[START] Iniciando servidor Django...")
    print("="*80 + "\n")
    
    try:
        # Ejecutar el servidor
        subprocess.run([sys.executable, 'manage.py', 'runserver'], check=True)
    except KeyboardInterrupt:
        print("\n\n" + "="*80)
        print("[STOP] ¡Servidor detenido! Gracias por usar Inversiones Castillo")
        print("="*80)
    except Exception as e:
        print(f"\n[ERROR] Error al ejecutar el servidor: {e}")

if __name__ == '__main__':
    main()