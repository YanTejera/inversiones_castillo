"""
Información de producción para mostrar al iniciar el servidor
"""

import os
from datetime import datetime

def get_production_info():
    """Obtiene la información de producción para mostrar"""
    return {
        'urls': {
            'frontend': 'https://inversiones-castillo-frontend.vercel.app',
            'backend': 'https://inversiones-castillo-backend.onrender.com',
            'admin': 'https://inversiones-castillo-backend.onrender.com/admin/',
            'api_docs': 'https://inversiones-castillo-backend.onrender.com/api/',
        },
        'credentials': {
            'username': 'admin',
            'password': 'admin123',
            'email': 'admin@inversionescastillo.com'
        },
        'database': {
            'type': 'PostgreSQL',
            'provider': 'Render.com'
        },
        'deployment': {
            'frontend_host': 'Vercel',
            'backend_host': 'Render.com',
            'last_deploy': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    }

def print_startup_info():
    """Imprime la información de inicio del servidor"""
    info = get_production_info()
    
    print("\n" + "="*80)
    print("INVERSIONES CASTILLO - SISTEMA DE GESTION")
    print("="*80)
    print()
    
    # URLs importantes
    print("ENLACES DE PRODUCCION:")
    print(f"   Frontend:    {info['urls']['frontend']}")
    print(f"   Backend:     {info['urls']['backend']}")
    print(f"   Admin Panel: {info['urls']['admin']}")
    print(f"   API Docs:    {info['urls']['api_docs']}")
    print()
    
    # Credenciales
    print("CREDENCIALES DE PRODUCCION:")
    print(f"   Usuario:     {info['credentials']['username']}")
    print(f"   Contraseña:  {info['credentials']['password']}")
    print(f"   Email:       {info['credentials']['email']}")
    print()
    
    # Información del entorno
    print("INFORMACION DEL ENTORNO:")
    is_debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    environment = "DESARROLLO" if is_debug else "PRODUCCIÓN"
    print(f"   Entorno:     {environment}")
    print(f"   Debug:       {'Activado' if is_debug else 'Desactivado'}")
    print(f"   Base de datos: {info['database']['type']} ({info['database']['provider']})")
    print()
    
    # Información de deployment
    print("INFORMACION DE DEPLOYMENT:")
    print(f"   Frontend:    {info['deployment']['frontend_host']}")
    print(f"   Backend:     {info['deployment']['backend_host']}")
    print(f"   Hora local:  {info['deployment']['last_deploy']}")
    print()
    
    # Enlaces útiles para desarrollo
    if is_debug:
        print("ENLACES LOCALES:")
        print("   Frontend:    http://localhost:5173")
        print("   Backend:     http://localhost:8000")
        print("   Admin:       http://localhost:8000/admin/")
        print("   API:         http://localhost:8000/api/")
        print()
    
    # Comandos útiles
    print("COMANDOS UTILES:")
    print("   Crear superuser:     python manage.py createsuperuser")
    print("   Ejecutar migraciones: python manage.py migrate")
    print("   Recopilar estáticos:  python manage.py collectstatic")
    print("   Ver logs:            python manage.py tail_logs (si existe)")
    print()
    
    print("="*80)
    print("Servidor iniciado correctamente")
    print("="*80)
    print()

def print_urls_only():
    """Imprime solo las URLs importantes (versión compacta)"""
    info = get_production_info()
    
    print("\n>> Enlaces rapidos:")
    print(f"   Local:      http://localhost:8000/admin/ (admin/admin123)")
    print(f"   Backend:    http://localhost:8000/")
    print(f"   Produccion: {info['urls']['admin']}")
    print(f"   Frontend:   {info['urls']['frontend']}")
    print()