# 🚀 Guía Completa de Deployment en Render

Esta guía te llevará paso a paso para subir tu aplicación a producción en Render.

## 📋 Pre-requisitos

- [ ] Cuenta en [Render.com](https://render.com)
- [ ] Cuenta en GitHub/GitLab
- [ ] Código subido a un repositorio

## 🔍 Verificación Pre-Deploy

Antes de subir, ejecuta el script de verificación:

```bash
python check_deploy_readiness.py
```

**Debe mostrar "TODO LISTO PARA DEPLOYMENT EN RENDER!"**

## 📁 Estructura Final del Proyecto

```
inversiones_castillo/
├── backend/
│   ├── concesionario_app/
│   ├── usuarios/
│   ├── motos/
│   ├── ventas/
│   ├── pagos/
│   ├── requirements.txt ✅
│   ├── build.sh ✅
│   ├── Procfile ✅
│   ├── production_settings.py ✅
│   └── .env.production ✅
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json ✅
│   ├── _redirects ✅
│   └── .env.production ✅
├── render.yaml ✅
├── .gitignore ✅
├── ENVIRONMENT_VARIABLES.md ✅
└── README.md ✅
```

## 🗂️ Paso 1: Subir Código a GitHub

```bash
# Si no tienes Git iniciado
git init
git add .
git commit -m "Initial commit - Ready for Render deployment"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/inversiones-castillo.git
git branch -M main
git push -u origin main
```

## 🗄️ Paso 2: Crear Base de Datos PostgreSQL

1. En [Render Dashboard](https://dashboard.render.com):
   - Click **"New"** → **"PostgreSQL"**
   
2. Configuración:
   ```
   Name: concesionario-db
   Database Name: concesionario_prod
   User: concesionario_user
   Region: Oregon (US West)
   Plan: Starter ($7/mes)
   ```
   
3. Click **"Create Database"**
4. **Guardar la Database URL** que aparece (la necesitarás después)

## 🖥️ Paso 3: Crear Backend (Web Service)

1. En Render Dashboard:
   - Click **"New"** → **"Web Service"**
   
2. Conectar repositorio:
   - Conectar tu cuenta GitHub/GitLab
   - Seleccionar el repositorio `inversiones-castillo`
   
3. Configuración del servicio:
   ```
   Name: concesionario-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: ./build.sh
   Start Command: gunicorn concesionario_app.wsgi:application
   Plan: Starter ($7/mes)
   ```

4. **Variables de Entorno** (Environment Variables):
   ```
   SECRET_KEY = [Click "Generate"] ← Usar botón automático
   DEBUG = False
   DATABASE_URL = [Internal Connection String de tu DB] ← Copiar de la DB creada
   ALLOWED_HOSTS = tu-backend-name.onrender.com
   CORS_ALLOW_ALL_ORIGINS = False
   ```

5. Click **"Create Web Service"**

6. **Esperar que el deploy termine** (5-10 minutos)

## 🎨 Paso 4: Crear Frontend (Static Site)

1. En Render Dashboard:
   - Click **"New"** → **"Static Site"**
   
2. Conectar el mismo repositorio
   
3. Configuración del sitio:
   ```
   Name: concesionario-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Variables de Entorno**:
   ```
   VITE_API_URL = https://tu-backend-name.onrender.com/api
   ```
   *Reemplaza "tu-backend-name" con el nombre real de tu backend*

5. Click **"Create Static Site"**

## 🔗 Paso 5: Conectar Frontend y Backend

Una vez que ambos servicios estén deployed:

1. **Actualizar Backend** con URL real del Frontend:
   - Ir a tu backend service → Environment
   - Editar `ALLOWED_HOSTS` y `FRONTEND_URL`:
   ```
   ALLOWED_HOSTS = tu-backend-real.onrender.com
   FRONTEND_URL = https://tu-frontend-real.onrender.com
   ```

2. **Redeploy el Backend** para aplicar cambios

## 🧪 Paso 6: Testing Post-Deploy

### 6.1 Test del Backend
```bash
# Verificar que la API responde
curl https://tu-backend.onrender.com/api/auth/roles/

# Debería devolver error 401 (normal, necesita autenticación)
```

### 6.2 Test del Frontend
1. Abrir `https://tu-frontend.onrender.com`
2. Debería cargar la página de login
3. Intentar login con:
   - **Usuario**: `admin`
   - **Password**: `admin123`

### 6.3 Test Completo
Si el login funciona y puedes ver el dashboard, ¡SUCCESS! 🎉

## ❌ Troubleshooting

### Error: "Application failed to start"
```bash
# Ver logs del backend
https://dashboard.render.com → Tu Backend Service → Logs

# Problemas comunes:
- Build script falló → Revisar build.sh
- Variables de entorno faltantes → Verificar ENV vars
- Error de base de datos → Verificar DATABASE_URL
```

### Error: "404 Not Found" en Frontend
```bash
# Verificar:
- Build command: npm install && npm run build
- Publish directory: dist
- Archivo _redirects en la raíz del build
```

### Error de CORS
```bash
# En el backend, verificar:
FRONTEND_URL = https://tu-frontend-correcto.onrender.com
CORS_ALLOW_ALL_ORIGINS = False

# Redeploy después de cambios
```

### Error de Base de Datos
```bash
# Verificar en logs del backend:
- Migraciones ejecutadas correctamente
- DATABASE_URL correcta
- Conexión a PostgreSQL establecida
```

## 🔄 Actualizaciones Futuras

Para actualizar la aplicación:

1. **Hacer cambios en tu código local**
2. **Commit y push a GitHub**:
   ```bash
   git add .
   git commit -m "Update: descripción del cambio"
   git push origin main
   ```
3. **Render autodeploya automáticamente** 🚀

## 📊 Monitoreo

### Logs en Vivo
- Backend: `https://dashboard.render.com → Tu Backend → Logs`
- Build logs: `https://dashboard.render.com → Tu Backend → Events`

### Métricas
- CPU/Memory usage en el dashboard
- Uptime monitoring automático
- Email alerts por downtime

## 💰 Costos

- **PostgreSQL Starter**: $7/mes
- **Web Service Starter**: $7/mes  
- **Static Site**: GRATIS
- **Total**: ~$14/mes

## 🎯 URLs Finales

Después del deployment exitoso tendrás:

- **Frontend**: `https://concesionario-frontend.onrender.com`
- **Backend API**: `https://concesionario-backend.onrender.com/api`
- **Admin Django**: `https://concesionario-backend.onrender.com/admin`

## ✅ Checklist Final

- [ ] Base de datos PostgreSQL creada
- [ ] Backend deployed y funcionando
- [ ] Frontend deployed y funcionando
- [ ] Login funciona correctamente
- [ ] Dashboard muestra datos
- [ ] Variables de entorno configuradas
- [ ] URLs actualizadas entre servicios
- [ ] Tests post-deploy completados

## 🎉 ¡Felicitaciones!

Tu aplicación ya está en producción y accesible desde cualquier lugar del mundo.

**Próximos pasos:**
1. Configurar dominio personalizado (opcional)
2. Configurar SSL/HTTPS (automático en Render)
3. Configurar backups de base de datos
4. Monitoreo y alertas
5. Desarrollar nuevas funcionalidades

## 📞 Soporte

Si tienes problemas:
1. Revisar logs en Render Dashboard
2. Verificar variables de entorno
3. Consultar documentación de Render
4. Contactar soporte de Render (excelente servicio)