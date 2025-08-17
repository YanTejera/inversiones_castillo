#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def show_startup_info():
    """Muestra información útil al iniciar el servidor"""
    try:
        from concesionario_app.production_info import print_startup_info
        print_startup_info()
    except ImportError:
        # Si no se puede importar, mostrar información básica
        print("\n" + "="*60)
        print("🏍️  INVERSIONES CASTILLO - SERVIDOR INICIADO")
        print("="*60)
        print("🌐 Producción: https://inversiones-castillo-frontend.vercel.app")
        print("🔐 Admin: admin/admin123")
        print("="*60 + "\n")


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'concesionario_app.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Mostrar información al ejecutar runserver
    if len(sys.argv) > 1 and sys.argv[1] == 'runserver':
        show_startup_info()
    
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
