# Sistema de Gestión de Concesionario de Motocicletas

## Descripción
Sistema web completo para la gestión de ventas y cobros de un concesionario de motocicletas, desarrollado con Django (backend) y React (frontend).

## Características Principales

### ✅ Funcionalidades Implementadas (Fase 1)
- **Sistema de Autenticación**: Login con roles de usuario (Administrador, Vendedor, Cobrador, Contador)
- **Dashboard Principal**: Estadísticas de ventas, pagos y stock crítico
- **API REST Completa**: Endpoints para todas las entidades del sistema
- **Interfaz Moderna**: Frontend con React, TypeScript y Tailwind CSS
- **Base de Datos**: Modelos completos para usuarios, clientes, motos, ventas y pagos

### 🔧 Estructura del Proyecto

```
inversiones_castillo/
├── backend/                 # API Django
│   ├── concesionario_app/   # Configuración principal
│   ├── usuarios/            # App de usuarios y clientes
│   ├── motos/              # App de motocicletas
│   ├── ventas/             # App de ventas
│   ├── pagos/              # App de pagos y reportes
│   └── requirements.txt     # Dependencias Python
└── frontend/               # Aplicación React
    ├── src/
    │   ├── components/     # Componentes reutilizables
    │   ├── pages/         # Páginas principales
    │   ├── services/      # Servicios de API
    │   ├── contexts/      # Contextos de React
    │   └── types/         # Tipos de TypeScript
    └── package.json       # Dependencias Node.js
```

## 🚀 Instalación y Ejecución

### ⚡ Método Rápido (Recomendado)

#### Windows:
```bash
# Configuración inicial (solo la primera vez)
setup_development.bat

# Iniciar ambos servidores
start_local.bat

# Probar que todo funcione
python test_api.py

# Detener servidores
stop_servers.bat
```

#### Linux/Mac:
```bash
# Dar permisos de ejecución
chmod +x start_local.sh

# Iniciar ambos servidores
./start_local.sh

# Probar que todo funcione
python3 test_api.py
```

### 🔧 Método Manual

#### Backend (Django)
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python create_initial_data.py
python manage.py runserver 0.0.0.0:8000
```

#### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## 👥 Usuarios por Defecto
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Administrador

## 🌐 URLs de Acceso
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin

## 📊 Modelos de Base de Datos

### Usuarios y Roles
- **Rol**: Define permisos (Administrador, Vendedor, Cobrador, Contador)
- **Usuario**: Usuarios del sistema con roles asignados
- **Cliente**: Información de clientes del concesionario
- **Fiador**: Información de fiadores para ventas financiadas
- **Documento**: Documentos asociados a clientes

### Inventario
- **Moto**: Información completa de motocicletas (marca, modelo, precios, stock)

### Ventas y Pagos
- **Venta**: Registro de ventas con tipo (contado/financiado)
- **VentaDetalle**: Detalles de productos en cada venta
- **Pago**: Registro de pagos realizados
- **Reporte**: Generación de reportes del sistema
- **Auditoria**: Registro de acciones para auditoría

## 🛠️ Tecnologías Utilizadas

### Backend
- **Django 5.2.5**: Framework web principal
- **Django REST Framework**: API REST
- **Django CORS Headers**: Manejo de CORS
- **SQLite**: Base de datos (desarrollo)
- **PostgreSQL**: Base de datos (producción)
- **Pillow**: Manejo de imágenes

### Frontend
- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **React Router**: Enrutamiento
- **Axios**: Cliente HTTP
- **Tailwind CSS**: Framework CSS
- **Lucide React**: Iconos

## 🚀 Deployment

### Render (Recomendado)
El proyecto está configurado para deployment automático en Render:

1. **Backend**: 
   - Crear Web Service en Render
   - Conectar repositorio
   - Build Command: `./build.sh`
   - Start Command: `gunicorn concesionario_app.wsgi:application`

2. **Frontend**:
   - Crear Static Site en Render
   - Build Command: `npm run build`
   - Publish Directory: `dist`

### Variables de Entorno (Producción)
```env
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.onrender.com
DATABASE_URL=postgresql://user:pass@host:port/dbname
FRONTEND_URL=https://your-frontend.onrender.com
```

## 📝 Próximas Fases

### Fase 2 - Módulo de Gestión de Motos
- CRUD completo de motocicletas
- Actualización de stock en tiempo real
- Búsqueda y filtrado avanzado

### Fase 3 - Módulo de Clientes y Ventas
- Registro completo de ventas
- Generación de facturas PDF
- Control de documentos

### Fase 4 - Módulo de Pagos y Cobros
- Registro de pagos mensuales
- Cálculo automático de saldos
- Reportes de cobranza

### Fase 5 - Panel Administrativo
- Estadísticas avanzadas
- Gráficos interactivos
- Exportación de reportes

### Fase 6 - Versión Móvil
- App Android/iOS con React Native
- Sincronización en tiempo real

## 🤝 Contribución
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia
Este proyecto es privado y pertenece a Inversiones Castillo.

## 📞 Soporte
Para soporte técnico, contacta al equipo de desarrollo.