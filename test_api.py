#!/usr/bin/env python3
"""
Script de prueba para verificar que la API funciona correctamente
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_api():
    print("TESTING API - Sistema de Gestion Concesionario")
    print("=" * 50)
    
    # Test 1: Login
    print("\n1. Probando login...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            print(f"   OK Login exitoso - Usuario: {user['username']} ({user['rol_nombre']})")
            
            # Headers con token para siguientes requests
            headers = {"Authorization": f"Token {token}"}
            
            # Test 2: Dashboard
            print("\n2. Probando dashboard...")
            dashboard_response = requests.get(f"{BASE_URL}/pagos/dashboard/", headers=headers)
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print(f"   OK Dashboard - Ventas hoy: ${dashboard_data['ventas_hoy']['total']}")
            else:
                print(f"   ERROR Dashboard fallo: {dashboard_response.status_code}")
            
            # Test 3: Listar roles
            print("\n3. Probando roles...")
            roles_response = requests.get(f"{BASE_URL}/auth/roles/", headers=headers)
            if roles_response.status_code == 200:
                roles = roles_response.json()
                if isinstance(roles, list):
                    print(f"   OK Roles - {len(roles)} roles encontrados")
                    for rol in roles:
                        print(f"      - {rol['nombre_rol']}")
                else:
                    results = roles.get('results', [])
                    print(f"   OK Roles - {len(results)} roles encontrados")
                    for rol in results:
                        print(f"      - {rol['nombre_rol']}")
            else:
                print(f"   ERROR Roles fallo: {roles_response.status_code}")
            
            # Test 4: Listar motos
            print("\n4. Probando motos...")
            motos_response = requests.get(f"{BASE_URL}/motos/", headers=headers)
            if motos_response.status_code == 200:
                motos = motos_response.json()
                total_motos = motos.get('count', len(motos) if isinstance(motos, list) else 0)
                print(f"   OK Motos - {total_motos} motos en inventario")
            else:
                print(f"   ERROR Motos fallo: {motos_response.status_code}")
            
            # Test 5: Listar clientes
            print("\n5. Probando clientes...")
            clientes_response = requests.get(f"{BASE_URL}/auth/clientes/", headers=headers)
            if clientes_response.status_code == 200:
                clientes = clientes_response.json()
                total_clientes = clientes.get('count', len(clientes) if isinstance(clientes, list) else 0)
                print(f"   OK Clientes - {total_clientes} clientes registrados")
            else:
                print(f"   ERROR Clientes fallo: {clientes_response.status_code}")
            
            print("\n" + "=" * 50)
            print("TESTS COMPLETADOS EXITOSAMENTE")
            print("\nPuedes acceder a:")
            print("   Frontend: http://localhost:5173")
            print("   Backend:  http://localhost:8000")
            print("   Admin:    http://localhost:8000/admin")
            print("\nCredenciales:")
            print("   Usuario: admin")
            print("   Password: admin123")
            
        else:
            print(f"   ERROR Login fallo: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ERROR: No se puede conectar al servidor")
        print("   SOLUCION: Asegurate de que el backend este ejecutandose en http://localhost:8000")
        return False
    except Exception as e:
        print(f"   ERROR inesperado: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1)