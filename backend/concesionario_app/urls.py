"""
URL configuration for concesionario_app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.generic import TemplateView

def api_root(request):
    return JsonResponse({
        'message': 'Inversiones C&C API',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/auth/',
            'usuarios': '/api/usuarios/',
            'motos': '/api/motos/',
            'ventas': '/api/ventas/',
            'pagos': '/api/pagos/',
            'reportes': '/api/reportes/'
        }
    })

def frontend_view(request):
    """
    Vista catch-all para servir el frontend SPA.
    Retorna una respuesta simple que redirige al frontend.
    """
    from django.http import HttpResponseRedirect
    from decouple import config
    # En producción, redirigir al frontend deployado
    if not settings.DEBUG:
        frontend_url = config('FRONTEND_URL', default='https://inversiones-castillo1.onrender.com')
        return HttpResponseRedirect(frontend_url)
    # En desarrollo, mostrar mensaje informativo
    return JsonResponse({
        'message': 'Frontend route - please access via React app on port 3000',
        'frontend_url': 'http://localhost:3000'
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include(('usuarios.urls', 'usuarios'), namespace='auth')),
    path('api/usuarios/', include(('usuarios.urls', 'usuarios'), namespace='usuarios')),
    path('api/motos/', include('motos.urls')),
    path('api/ventas/', include('ventas.urls')),
    path('api/pagos/', include('pagos.urls')),
    path('api/reportes/', include('reportes.urls')),
]

# Serve media files in development and production
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all pattern for frontend SPA routes (must be last)
# This handles routes like /home, /clientes, /ventas, etc.
urlpatterns += [
    re_path(r'^(?!api/).*$', frontend_view, name='frontend_catchall'),
]
