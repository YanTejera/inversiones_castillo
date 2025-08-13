# SETUP MANUAL EN RENDER - PASO A PASO

## Opción 1: Sin archivo render.yaml

1. **Ve a render.com y haz login**
2. **Haz clic en "New +" → "Web Service"**
3. **Conecta tu repositorio:**
   - Selecciona "Connect a repository"
   - Busca: `YanTejera/inversiones_castillo`
   - Haz clic en "Connect"

4. **Configuración manual:**
   ```
   Name: concesionario-backend-free
   Runtime: Python 3
   Branch: main
   Root Directory: backend
   Build Command: ./build_free.sh
   Start Command: gunicorn concesionario_app.wsgi:application
   Instance Type: Free
   ```

5. **Variables de entorno (añadir una por una):**
   ```
   DEBUG = false
   SECRET_KEY = [Genera automáticamente]
   ALLOWED_HOSTS = *
   CORS_ALLOW_ALL_ORIGINS = true
   USE_SQLITE = true
   ```

6. **Haz clic en "Create Web Service"**

## Opción 2: Eliminar render.yaml y usar configuración automática

Si sigues teniendo problemas, simplemente:

1. Elimina el archivo `render_free.yaml`
2. Ve a Render y crea el servicio manualmente
3. Render detectará automáticamente que es una app Python Django

## URLs importantes

- Repositorio: https://github.com/YanTejera/inversiones_castillo.git
- Una vez desplegado: https://concesionario-backend-free.onrender.com
- Admin Django: https://concesionario-backend-free.onrender.com/admin
- API: https://concesionario-backend-free.onrender.com/api/

## Credenciales por defecto

- Usuario: admin
- Password: admin123
- (Se crean automáticamente en build_free.sh)