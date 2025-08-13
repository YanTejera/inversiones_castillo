# 🧪 Guía de Testing Local

Esta guía te ayudará a probar la aplicación en tu entorno local antes de subirla a producción.

## 📋 Prerrequisitos

- Python 3.11+ instalado
- Node.js 18+ instalado
- Git (opcional)

## 🚀 Inicio Rápido

### 1. Configuración Inicial (solo la primera vez)

**Windows:**
```bash
setup_development.bat
```

**Linux/Mac:**
```bash
chmod +x *.sh
```

### 2. Iniciar Servidores

**Windows:**
```bash
start_local.bat
```

**Linux/Mac:**
```bash
./start_local.sh
```

### 3. Verificar que Todo Funcione

```bash
python test_api.py
```

**Salida esperada:**
```
TESTING API - Sistema de Gestion Concesionario
==================================================

1. Probando login...
   OK Login exitoso - Usuario: admin (Administrador)

2. Probando dashboard...
   OK Dashboard - Ventas hoy: $0

3. Probando roles...
   OK Roles - 4 roles encontrados
      - Administrador
      - Vendedor
      - Cobrador
      - Contador

4. Probando motos...
   OK Motos - 0 motos en inventario

5. Probando clientes...
   OK Clientes - 0 clientes registrados

==================================================
TESTS COMPLETADOS EXITOSAMENTE
```

## 🌐 URLs de Testing

Una vez iniciados los servidores:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

## 🔑 Credenciales de Prueba

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Administrador (acceso completo)

## 📱 Testing Manual del Frontend

### 1. Prueba de Login
1. Ir a http://localhost:5173
2. Usar las credenciales: admin/admin123
3. Verificar que redirija al dashboard

### 2. Prueba de Dashboard
1. Verificar que aparezcan las estadísticas
2. Comprobar que los números se muestren correctamente
3. Verificar que no haya errores en la consola del navegador

### 3. Prueba de Navegación
1. Hacer clic en cada elemento del menú lateral
2. Verificar que las páginas cargan correctamente
3. Probar en móvil (responsive design)

### 4. Prueba de Logout
1. Hacer clic en "Cerrar Sesión"
2. Verificar que redirija al login
3. Intentar acceder a una página protegida (debería redirigir al login)

## 🔧 Testing de la API

### Endpoints Principales:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Dashboard (requiere token)
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/pagos/dashboard/

# Listar roles
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/auth/roles/
```

## ❌ Solución de Problemas

### Error: "No se puede conectar al servidor"
```bash
# Verificar que Django esté corriendo
python manage.py runserver 0.0.0.0:8000
```

### Error: "Module not found"
```bash
# Reinstalar dependencias
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

### Error: "Database doesn't exist"
```bash
# Aplicar migraciones
cd backend
python manage.py migrate
python create_initial_data.py
```

### Puerto ocupado
```bash
# Cambiar puerto de Django
python manage.py runserver 0.0.0.0:8001

# Cambiar puerto de React (en package.json)
"dev": "vite --port 3001"
```

## 🛑 Detener Servidores

**Windows:**
```bash
stop_servers.bat
```

**Linux/Mac:**
```bash
# Ctrl+C en la terminal donde ejecutaste start_local.sh
```

## 📊 Métricas de Performance

Para verificar el rendimiento:

1. Abrir DevTools del navegador (F12)
2. Ir a la pestaña "Network"
3. Recargar la página
4. Verificar que:
   - Requests tarden menos de 500ms
   - No haya errores 4xx/5xx
   - El bundle de JS sea menor a 2MB

## 🔍 Logs de Debugging

### Backend (Django):
- Los logs aparecen en la consola donde ejecutaste `runserver`
- Para más detalle: agregar `DEBUG=True` en `.env`

### Frontend (React):
- Abrir DevTools del navegador
- Ver la consola para errores de JavaScript
- Network tab para errores de API

## ✅ Checklist de Testing

Antes de subir a producción, verificar:

- [ ] Login funciona correctamente
- [ ] Dashboard muestra datos reales
- [ ] Navegación entre páginas funciona
- [ ] API responde a todos los endpoints
- [ ] No hay errores en la consola
- [ ] Responsive design funciona en móvil
- [ ] Logout funciona correctamente
- [ ] Script de testing pasa todos los tests

## 🚀 Listo para Producción

Una vez que todos los tests pasen, la aplicación está lista para deployment en Render u otra plataforma.

## 📞 Soporte

Si tienes problemas durante el testing:

1. Revisa esta guía de troubleshooting
2. Verifica los logs de backend y frontend
3. Ejecuta `python test_api.py` para diagnóstico automático