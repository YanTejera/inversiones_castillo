# 🖥️ ENTORNO DE DESARROLLO LOCAL

Esta guía te permitirá desarrollar y probar la aplicación localmente antes de subir cambios a producción.

## 📋 REQUISITOS PREVIOS

- Python 3.8+ 
- Node.js 16+
- Git

## 🔧 CONFIGURACIÓN INICIAL

### 1. CLONAR EL REPOSITORIO

```bash
git clone https://github.com/YanTejera/inversiones_castillo.git
cd inversiones_castillo
```

### 2. CONFIGURAR BACKEND (Django)

```bash
# Ir al directorio backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos SQLite local
python manage.py migrate

# Crear datos iniciales (roles y admin)
python create_initial_data.py

# Ejecutar servidor de desarrollo
python manage.py runserver
```

**El backend estará disponible en:** `http://localhost:8000`

### 3. CONFIGURAR FRONTEND (React)

```bash
# En una nueva terminal, ir al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

**El frontend estará disponible en:** `http://localhost:5173`

## 🎯 URLS LOCALES

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/
- **Admin Django:** http://localhost:8000/admin/
- **Credenciales:** admin / admin123

## 📁 ESTRUCTURA DE DESARROLLO

```
inversiones_castillo/
├── backend/                 # Django API
│   ├── manage.py
│   ├── requirements.txt
│   ├── concesionario_app/   # Configuración principal
│   ├── usuarios/            # Gestión de usuarios y clientes
│   ├── motos/              # Gestión de motocicletas
│   ├── ventas/             # Gestión de ventas
│   └── pagos/              # Gestión de pagos
├── frontend/               # React App
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── render_free.yaml        # Configuración para producción
```

## 🔄 FLUJO DE DESARROLLO

### DESARROLLO DIARIO:
1. **Hacer cambios en local**
2. **Probar en localhost**
3. **Cuando esté listo, commit y push**

### COMANDOS ÚTILES:

```bash
# Iniciar desarrollo backend
cd backend
venv\Scripts\activate  # Windows
python manage.py runserver

# Iniciar desarrollo frontend
cd frontend
npm run dev

# Hacer migraciones (cuando cambies modelos)
cd backend
python manage.py makemigrations
python manage.py migrate

# Crear superusuario adicional
python manage.py createsuperuser
```

## 🚀 DEPLOYMENT A PRODUCCIÓN

Cuando tengas funcionalidades listas:

```bash
# 1. Commit tus cambios
git add .
git commit -m "Descripción de los cambios"
git push origin main

# 2. En Render, hacer Manual Deploy de:
#    - Backend Web Service
#    - Frontend Static Site
```

## 🎛️ VARIABLES DE ENTORNO LOCALES

Crea un archivo `.env` en el directorio `backend/`:

```env
DEBUG=True
SECRET_KEY=tu-secret-key-local
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

Crea un archivo `.env.local` en el directorio `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api
```

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Backend no inicia:
- Verifica que el entorno virtual esté activado
- Instala dependencias: `pip install -r requirements.txt`
- Ejecuta migraciones: `python manage.py migrate`

### Frontend no conecta al backend:
- Verifica que el backend esté corriendo en puerto 8000
- Revisa el archivo `.env.local` del frontend

### Error de CORS:
- El backend ya está configurado para aceptar localhost:5173

## ✅ VERIFICACIÓN

Para confirmar que todo funciona:

1. **Backend:** Ve a http://localhost:8000/admin (login: admin/admin123)
2. **Frontend:** Ve a http://localhost:5173 y haz login
3. **API:** Ve a http://localhost:8000/api/dashboard/

¡Listo! Ahora puedes desarrollar localmente y subir solo cuando tengas funcionalidades completas.