#!/usr/bin/env python3
"""
Script para verificar que la aplicación esté lista para deployment en Render
"""
import os
import sys

def check_file_exists(file_path, description):
    """Verifica si un archivo existe"""
    if os.path.exists(file_path):
        print(f"OK {description}: {file_path}")
        return True
    else:
        print(f"ERROR {description}: {file_path} - NO ENCONTRADO")
        return False

def check_deploy_readiness():
    """Verifica que todos los archivos necesarios para deploy existan"""
    print("VERIFICANDO PREPARACION PARA RENDER DEPLOYMENT")
    print("=" * 60)
    
    all_good = True
    
    # Backend files
    print("\nBACKEND:")
    backend_files = [
        ("backend/requirements.txt", "Requirements file"),
        ("backend/build.sh", "Build script"),
        ("backend/Procfile", "Procfile (alternativo)"),
        ("backend/manage.py", "Django manage.py"),
        ("backend/concesionario_app/wsgi.py", "WSGI configuration"),
        ("backend/production_settings.py", "Production settings"),
        ("backend/.env.production", "Production env template"),
    ]
    
    for file_path, description in backend_files:
        if not check_file_exists(file_path, description):
            all_good = False
    
    # Frontend files
    print("\nFRONTEND:")
    frontend_files = [
        ("frontend/package.json", "Package.json"),
        ("frontend/vite.config.ts", "Vite config"),
        ("frontend/src/App.tsx", "Main App component"),
        ("frontend/.env.production", "Production env template"),
    ]
    
    for file_path, description in frontend_files:
        if not check_file_exists(file_path, description):
            all_good = False
    
    # Deployment files
    print("\nDEPLOYMENT:")
    deploy_files = [
        ("render.yaml", "Render configuration"),
        (".gitignore", "Git ignore file"),
        ("README.md", "Documentation"),
    ]
    
    for file_path, description in deploy_files:
        if not check_file_exists(file_path, description):
            all_good = False
    
    # Check for files that shouldn't be deployed
    print("\nARCHIVOS QUE NO DEBEN SUBIRSE:")
    avoid_files = [
        ("backend/venv/", "Virtual environment"),
        ("frontend/node_modules/", "Node modules"),
        ("backend/db.sqlite3", "Local database"),
    ]
    
    for file_path, description in avoid_files:
        if os.path.exists(file_path):
            print(f"WARNING {description}: {file_path} - REMOVER ANTES DE SUBIR")
            all_good = False
        else:
            print(f"OK {description}: No encontrado (correcto)")
    
    print("\n" + "=" * 60)
    if all_good:
        print("TODO LISTO PARA DEPLOYMENT EN RENDER!")
        print("\nProximos pasos:")
        print("1. Subir codigo a GitHub/GitLab")
        print("2. Crear servicios en Render Dashboard")
        print("3. Configurar variables de entorno")
        print("4. Hacer deploy!")
        return True
    else:
        print("HAY PROBLEMAS QUE RESOLVER ANTES DEL DEPLOYMENT")
        print("\nRevisa los archivos marcados como faltantes o problematicos")
        return False

if __name__ == "__main__":
    success = check_deploy_readiness()
    sys.exit(0 if success else 1)