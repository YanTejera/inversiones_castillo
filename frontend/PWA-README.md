# Logo y PWA Setup - Inversiones C&C

## 🎨 Logo del Concesionario

El logo REAL de Inversiones C&C ha sido integrado completamente en la aplicación:

### Archivos de Logo
- `/public/logo.png` - Logo oficial del concesionario en formato PNG

### Características del Logo
- **Formato**: PNG original del concesionario
- **Ubicaciones**: Visible en sidebar, headers móvil/desktop, favicon, PWA
- **Optimización**: Se escala automáticamente para todos los tamaños necesarios

## 📱 Progressive Web App (PWA)

La aplicación ahora es una PWA completa con las siguientes características:

### Instalación Móvil
- ✅ Se puede instalar en la pantalla de inicio de móviles
- ✅ Icono personalizado del concesionario (no icono gris genérico)
- ✅ Funciona offline básico con Service Worker

### Archivos PWA
- `/public/manifest.json` - Configuración de la PWA
- `/public/sw.js` - Service Worker para funcionalidad offline
- `/public/browserconfig.xml` - Configuración para Windows/IE

### Características de Instalación
- **Nombre**: "Inversiones C&C - Sistema de Gestión"
- **Nombre corto**: "Inversiones C&C"
- **Color de tema**: Azul (#1e40af)
- **Iconos**: Múltiples tamaños desde 72x72 hasta 512x512
- **Shortcuts**: Dashboard, Clientes, Motocicletas

## 🔧 Implementación Técnica

### En la App
- Logo integrado en el header/sidebar (Layout.tsx)
- Logo visible en versiones móvil y desktop
- Favicon actualizado con el logo del concesionario

### Meta Tags
- Apple Touch Icons para iOS
- Open Graph para redes sociales
- Twitter Cards
- Windows Tile configuration

### Service Worker
- Cache básico para assets estáticos
- Registro automático en main.tsx
- Estrategia cache-first para logos y manifest

## 📲 Instrucciones para el Usuario

### En Móvil (Android/iOS)
1. Abrir la aplicación en el navegador
2. Buscar el botón "Agregar a pantalla de inicio" o "Instalar app"
3. El icono del concesionario aparecerá en la pantalla de inicio
4. Al tocar el icono, se abrirá como una app nativa

### En Desktop
1. En Chrome: Icono de instalación en la barra de direcciones
2. En Edge: Opción "Instalar esta app"
3. La app se puede abrir como ventana independiente

## 🎯 Beneficios

- **Marca consistente**: Logo del concesionario visible en toda la experiencia
- **Experiencia nativa**: Se siente como una app instalada
- **Acceso rápido**: Icono directo en la pantalla de inicio
- **Offline básico**: Funciona aunque no haya internet (para elementos cacheados)
- **SEO mejorado**: Meta tags optimizados para buscadores y redes sociales

## 🔄 Actualizaciones Futuras

Para actualizar el logo o iconos:
1. Reemplazar `/public/logo.svg` y `/public/logo-small.svg`
2. Regenerar iconos con el script si es necesario
3. Actualizar el cache version en `sw.js` si hay cambios importantes