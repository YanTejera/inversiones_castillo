"""
Settings para deployment GRATUITO en Render con SQLite
"""
from .settings import *
import os

# Force SQLite for free deployment
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_data' / 'db.sqlite3',
    }
}

# Free tier optimizations
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = ['*']

# CORS optimizado para plan gratuito
CORS_ALLOW_ALL_ORIGINS = True  # Más flexible para testing

# Static files para plan gratuito
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Logging optimizado para plan gratuito
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',  # Menos logs para ahorrar recursos
        },
    },
}

# Configuración específica para plan gratuito
if config('USE_SQLITE', default=False, cast=bool):
    print("[FREE] Running on FREE plan with SQLite!")
    
    # Crear directorio para SQLite si no existe
    os.makedirs(BASE_DIR / 'db_data', exist_ok=True)