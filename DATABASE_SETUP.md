# 🗄️ Configuración de Base de Datos PostgreSQL en Render

## ⚠️ PROBLEMA IDENTIFICADO

La base de datos se borra en cada deployment porque **estaba usando SQLite** en producción. SQLite se almacena como archivo en el contenedor, y **cada deploy destruye el contenedor**.

## ✅ SOLUCIÓN: PostgreSQL en Render

### Paso 1: Crear Base de Datos PostgreSQL
1. Ir al dashboard de Render
2. Hacer clic en "New +" → "PostgreSQL"
3. Configurar:
   - **Name**: `inversiones-castillo-db`
   - **Database**: `inversiones_castillo`
   - **User**: `inversiones_user`
   - **Region**: Same as your web service
   - **Plan**: Free tier

### Paso 2: Obtener DATABASE_URL
1. Una vez creada la BD, ir a "Info" tab
2. Copiar la **External Database URL**
3. Formato será algo como:
   ```
   postgresql://user:password@host:port/database
   ```

### Paso 3: Configurar Variable de Entorno
1. Ir a tu Web Service en Render
2. "Environment" tab
3. Agregar variable:
   - **Key**: `DATABASE_URL`
   - **Value**: La URL copiada del Paso 2

### Paso 4: Redeploy
1. Hacer cualquier cambio menor al código
2. Push a GitHub
3. Render detectará el cambio y redesployará
4. Esta vez **usará PostgreSQL persistente** 🎉

## 🔧 Configuración Adicional (Opcional)

### Variables de entorno recomendadas:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com
SECRET_KEY=your-secret-key
```

## ✅ Verificación
Una vez configurado:
1. Los datos **NO se borrarán** en deployments futuros
2. La base de datos será **persistente**
3. Mejor rendimiento que SQLite

## 🚨 Nota Importante
- **Desarrollo local**: Sigue usando SQLite (automático)
- **Producción**: Ahora requiere PostgreSQL (obligatorio)
- **Sin DATABASE_URL**: La app fallará al iniciar (por diseño)