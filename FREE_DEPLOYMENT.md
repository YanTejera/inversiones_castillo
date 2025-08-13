# 🆓 Deployment GRATUITO en Render

## 💰 Costo: $0/mes (100% GRATIS)

### ✅ Lo que obtienes GRATIS:
- **Frontend**: Hosting estático ilimitado
- **Backend**: 750 horas/mes (25 días de uso continuo)
- **Base de datos**: SQLite (perfecta para desarrollo)
- **SSL**: Certificado HTTPS automático
- **Dominio**: Subdominio .onrender.com

### ⚠️ Limitaciones del Plan Gratuito:
- **Sleep Mode**: Backend se duerme tras 15 min sin uso
- **Cold Start**: 30-60 segundos para despertar
- **RAM**: 512MB (suficiente para la app)

## 🚀 Deployment GRATUITO Paso a Paso

### 1. Usar Configuración Gratuita
```bash
# Renombrar archivo para plan gratuito
mv render.yaml render_paid.yaml
mv render_free.yaml render.yaml
```

### 2. Subir a GitHub
```bash
git add .
git commit -m "Free deployment ready"
git push origin main
```

### 3. Conectar en Render
1. Ir a [render.com](https://render.com)
2. Sign up/Login (GRATIS)
3. Connect GitHub repository
4. Render detecta `render.yaml` automáticamente
5. Click "Apply" - ¡Deploy automático! 🎉

### 4. Configurar Variables (Automáticas)
Render configura todo automáticamente desde `render_free.yaml`:
- ✅ SECRET_KEY (generada automáticamente)
- ✅ DEBUG = False
- ✅ USE_SQLITE = True
- ✅ URLs entre frontend y backend

## 📊 Monitoreo del Plan Gratuito

### Ver Uso de Horas:
- Dashboard → Tu servicio → Metrics
- 750 horas = ~25 días/mes de uso continuo
- Perfecto para desarrollo y demos

### Sleep Mode:
- ⏰ Se activa tras 15 min sin requests
- 🔄 Primer request tarda 30-60 seg (cold start)
- 💡 Solución: Hacer ping cada 10 min (opcional)

## 🔄 Migración a Plan Pago (Cuando Estés Listo)

### Paso 1: Cambiar a PostgreSQL
```bash
# Usar configuración paga
mv render.yaml render_free.yaml
mv render_paid.yaml render.yaml
git commit -m "Upgrade to paid plan"
git push
```

### Paso 2: Upgrade en Dashboard
- Dashboard → Service Settings → Plan
- Cambiar de "Free" a "Starter" ($7/mes)
- Agregar PostgreSQL ($7/mes)

### Paso 3: Migrar Datos (si es necesario)
```bash
# Exportar datos de SQLite
python manage.py dumpdata > backup.json

# Importar a PostgreSQL
python manage.py loaddata backup.json
```

## 🎯 URLs de tu App GRATUITA

Después del deploy:
- **Frontend**: `https://concesionario-frontend-free.onrender.com`
- **Backend**: `https://concesionario-backend-free.onrender.com`
- **Admin**: `https://concesionario-backend-free.onrender.com/admin`

## 💡 Tips para Maximizar Plan Gratuito

### 1. Mantener Activo (Opcional)
```bash
# Crear cron job para ping cada 10 min
# (solo si necesitas 24/7 uptime)
curl https://tu-backend.onrender.com/api/auth/roles/
```

### 2. Optimizar Performance
- ✅ Usar SQLite (ya configurado)
- ✅ Logs mínimos (ya configurado)
- ✅ CORS optimizado (ya configurado)

### 3. Monitorear Uso
- Check dashboard diariamente
- Ver métricas de uso de horas
- Planificar upgrade cuando sea necesario

## 🆓 ¿Cuándo Usar Plan Gratuito?

**PERFECTO para:**
- ✅ Desarrollo y testing
- ✅ Demos a clientes
- ✅ MVPs y prototipos
- ✅ Proyectos personales
- ✅ Aprender deployment

**Upgrade cuando:**
- 📈 Tengas usuarios reales 24/7
- 💾 Necesites más de 512MB RAM
- 🗄️ Necesites PostgreSQL
- ⚡ Cold starts molesten a usuarios

## 🎉 Resultado Final GRATIS

¡Tu aplicación profesional funcionando online SIN COSTO!

- 🌐 Accesible desde cualquier parte del mundo
- 🔒 HTTPS/SSL automático
- 📱 Responsive (funciona en móvil)
- 👥 Múltiples usuarios simultáneos
- 🔐 Sistema de login completo
- 📊 Dashboard con estadísticas

**Costo total: $0.00/mes** 🎉

¡Perfecto para desarrollar, probar y mostrar tu aplicación antes de decidir sobre el plan pago!