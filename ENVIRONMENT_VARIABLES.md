# 🔐 Variables de Entorno para Render

## 📋 Variables Requeridas para el Backend

### 🔒 Seguridad
- **SECRET_KEY**: Clave secreta de Django (Render puede generarla automáticamente)
- **DEBUG**: `False` para producción
- **ALLOWED_HOSTS**: Tu dominio de backend (ej: `mi-app-backend.onrender.com`)

### 🗄️ Base de Datos
- **DATABASE_URL**: URL de PostgreSQL (Render la proporciona automáticamente)

### 🌐 CORS y Frontend
- **FRONTEND_URL**: URL de tu frontend (ej: `https://mi-app-frontend.onrender.com`)
- **CORS_ALLOW_ALL_ORIGINS**: `False` para producción (opcional)

## 📋 Variables Requeridas para el Frontend

### 🔗 API
- **VITE_API_URL**: URL de tu backend (ej: `https://mi-app-backend.onrender.com/api`)

## 🚀 Configuración en Render Dashboard

### Backend (Web Service)
```
SECRET_KEY = [Generate Value] ← Usar botón de Render
DEBUG = False
DATABASE_URL = [From Database] ← Render lo conecta automáticamente
ALLOWED_HOSTS = tu-backend-domain.onrender.com
FRONTEND_URL = https://tu-frontend-domain.onrender.com
CORS_ALLOW_ALL_ORIGINS = False
```

### Frontend (Static Site)
```
VITE_API_URL = https://tu-backend-domain.onrender.com/api
```

## 📝 Instrucciones Paso a Paso

### 1. Crear el Backend (Web Service)
1. En Render Dashboard → New → Web Service
2. Conectar tu repositorio
3. Configurar:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn concesionario_app.wsgi:application`
4. Agregar variables de entorno (ver arriba)
5. Deploy!

### 2. Crear la Base de Datos
1. En Render Dashboard → New → PostgreSQL
2. Configurar:
   - **Name**: `concesionario-db`
   - **Database Name**: `concesionario_prod`
   - **User**: `concesionario_user`
3. Una vez creada, conectarla al Web Service

### 3. Crear el Frontend (Static Site)
1. En Render Dashboard → New → Static Site
2. Conectar el mismo repositorio
3. Configurar:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Agregar variables de entorno (ver arriba)
5. Deploy!

## 🔄 Actualizar Variables Después del Deploy

### Una vez que tengas las URLs reales:

**Backend ENV Variables:**
```
ALLOWED_HOSTS = tu-backend-real.onrender.com
FRONTEND_URL = https://tu-frontend-real.onrender.com
```

**Frontend ENV Variables:**
```
VITE_API_URL = https://tu-backend-real.onrender.com/api
```

## 🧪 Testing Post-Deploy

Después del deploy, verifica:

1. **Backend Health Check**:
   ```bash
   curl https://tu-backend.onrender.com/api/auth/roles/
   ```

2. **Frontend Loading**:
   - Abre https://tu-frontend.onrender.com
   - Debería cargar la página de login

3. **Login Test**:
   - Usuario: `admin`
   - Password: `admin123`

## ⚠️ Problemas Comunes

### Error de CORS
- Verificar que `FRONTEND_URL` esté bien configurada
- Asegurar que `CORS_ALLOW_ALL_ORIGINS = False`

### Error de Base de Datos
- Verificar que `DATABASE_URL` esté conectada
- Check que las migraciones corrieron en los logs

### Error 404 en Rutas del Frontend
- Verificar que `_redirects` esté en la carpeta `public/`
- Configurar Publish Directory como `dist`

## 📞 Comandos de Debug

Para debuggear en Render:

```bash
# Ver logs del backend
render logs -s tu-backend-service

# Ver variables de entorno
render env -s tu-backend-service

# Ejecutar comandos en el backend
render shell -s tu-backend-service
python manage.py shell
```