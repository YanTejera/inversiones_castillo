from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartamentoViewSet, PosicionViewSet, EmpleadoViewSet, 
    SolicitudTiempoViewSet, RegistroAsistenciaViewSet, NominaViewSet,
    DocumentoEmpleadoViewSet, EvaluacionDesempenoViewSet
)

router = DefaultRouter()
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'posiciones', PosicionViewSet)
router.register(r'empleados', EmpleadoViewSet)
router.register(r'solicitudes-tiempo', SolicitudTiempoViewSet)
router.register(r'asistencia', RegistroAsistenciaViewSet)
router.register(r'nominas', NominaViewSet)
router.register(r'documentos', DocumentoEmpleadoViewSet)
router.register(r'evaluaciones', EvaluacionDesempenoViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]