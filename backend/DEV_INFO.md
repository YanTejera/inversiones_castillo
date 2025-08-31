# [MOTO] Inversiones Castillo - Información de Desarrollo

## [START] Inicio Rápido

### Windows
```bash
# Opción 1: Script batch (recomendado)
start_server.bat

# Opción 2: Script Python
python start_server.py

# Opción 3: Django tradicional
python manage.py runserver
```

### Linux/Mac
```bash
# Script Python
python start_server.py

# Django tradicional
python manage.py runserver
```

## [WEB] Enlaces de Producción

| Servicio | URL |
|----------|-----|
| **Frontend** | https://inversiones-castillo-frontend.vercel.app |
| **Backend** | https://inversiones-castillo-backend.onrender.com |
| **Admin Panel** | https://inversiones-castillo-backend.onrender.com/admin/ |
| **API Docs** | https://inversiones-castillo-backend.onrender.com/api/ |

## [AUTH] Credenciales de Producción

- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Email:** `admin@inversionescastillo.com`

## [LOCAL] Enlaces Locales (Desarrollo)

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend** | http://localhost:8000 |
| **Admin Panel** | http://localhost:8000/admin/ |
| **API** | http://localhost:8000/api/ |

## [TIPS] Comandos Útiles

```bash
# Mostrar información de producción
python manage.py show_production_info

# Mostrar información compacta
python manage.py show_production_info --compact

# Crear superusuario
python manage.py createsuperuser

# Ejecutar migraciones
python manage.py migrate

# Recopilar archivos estáticos
python manage.py collectstatic

# Ejecutar servidor con información
python manage.py runserver_with_info

# Ejecutar servidor sin información
python manage.py runserver_with_info --no-info
```

## 📊 Información del Sistema

### Base de Datos
- **Tipo:** PostgreSQL (Producción) / SQLite (Desarrollo)
- **Provider:** Render.com (Producción)

### Hosting
- **Frontend:** Vercel
- **Backend:** Render.com

### Arquitectura
- **Frontend:** React + TypeScript + Vite
- **Backend:** Django + Django REST Framework
- **Autenticación:** JWT + Session Authentication

## [FLOW] Flujo de Desarrollo

1. **Iniciar servidor local:**
   ```bash
   start_server.bat  # Windows
   python start_server.py  # Cualquier OS
   ```

2. **Acceder al admin local:**
   - URL: http://localhost:8000/admin/
   - Usuario: `admin`
   - Contraseña: `admin123`

3. **Desarrollar y probar:**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:5173

4. **Deploy:**
   - Frontend se autodeploy en Vercel al hacer push
   - Backend se autodeploy en Render al hacer push

## 📱 Funcionalidades Principales

- ✅ Gestión de Clientes
- ✅ Inventario de Motocicletas
- ✅ Sistema de Ventas (7 pasos)
- ✅ Gestión de Pagos y Cuotas
- ✅ Documentos Dinámicos
- ✅ Reportes y Analytics
- ✅ Autenticación y Autorización

## 🛠️ Troubleshooting

### Error: No module named 'concesionario_app'
```bash
# Asegúrate de estar en el directorio backend
cd backend
python manage.py runserver
```

### Error: Port already in use
```bash
# Usar puerto diferente
python manage.py runserver 8001
```

### Error: Database connection
```bash
# Ejecutar migraciones
python manage.py migrate
```

---

[TIP] **Tip:** Ejecuta `python manage.py show_production_info` en cualquier momento para ver esta información.