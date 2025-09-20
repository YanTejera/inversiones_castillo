from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import SolicitudCredito, HistorialCredito, ComisionCalculada
from .services import ComisionService, NotificacionService
from ventas.models import Venta


@receiver(pre_save, sender=SolicitudCredito)
def crear_historial_cambio_estado(sender, instance, **kwargs):
    """Crear historial automático cuando cambia el estado de una solicitud"""
    if instance.pk:  # Solo para actualizaciones, no creaciones
        try:
            solicitud_anterior = SolicitudCredito.objects.get(pk=instance.pk)
            if solicitud_anterior.estado != instance.estado:
                # Se registrará en post_save para tener el usuario que hizo el cambio
                instance._estado_anterior = solicitud_anterior.estado
                instance._cambio_estado = True
        except SolicitudCredito.DoesNotExist:
            pass


@receiver(post_save, sender=SolicitudCredito)
def procesar_cambio_estado_solicitud(sender, instance, created, **kwargs):
    """Procesa cambios de estado y envía notificaciones"""
    if not created and hasattr(instance, '_cambio_estado'):
        # Crear registro en historial si no existe uno reciente
        historial_reciente = HistorialCredito.objects.filter(
            solicitud=instance,
            estado_nuevo=instance.estado,
            fecha__gte=timezone.now() - timezone.timedelta(minutes=1)
        ).exists()
        
        if not historial_reciente:
            # Intentar obtener el usuario desde el contexto (si está disponible)
            usuario = getattr(instance, '_usuario_cambio', None)
            
            HistorialCredito.objects.create(
                solicitud=instance,
                estado_anterior=instance._estado_anterior,
                estado_nuevo=instance.estado,
                usuario=usuario or instance.usuario_creacion,
                observaciones=f'Cambio automático de estado: {instance._estado_anterior} → {instance.estado}'
            )
        
        # Enviar notificaciones según el nuevo estado
        notificacion_service = NotificacionService()
        
        if instance.estado == 'aprobada':
            notificacion_service.notificar_solicitud_aprobada(instance)
        elif instance.estado == 'rechazada':
            notificacion_service.notificar_solicitud_rechazada(instance)
        elif instance.estado == 'documentos_pendientes':
            notificacion_service.notificar_documento_pendiente(instance)
        
        # Limpiar atributos temporales
        delattr(instance, '_cambio_estado')
        if hasattr(instance, '_estado_anterior'):
            delattr(instance, '_estado_anterior')


@receiver(post_save, sender=Venta)
def calcular_comision_automatica(sender, instance, created, **kwargs):
    """Calcula automáticamente la comisión cuando se completa una venta"""
    # Solo calcular para ventas completadas que no tengan comisión ya calculada
    if (instance.estado == 'completada' and 
        not hasattr(instance, 'comision') and
        instance.vendedor):
        
        try:
            comision_service = ComisionService()
            comision = comision_service.calcular_comision_venta(instance)
            
            # Enviar notificación de comisión calculada
            notificacion_service = NotificacionService()
            notificacion_service.notificar_comision_calculada(comision)
            
        except Exception as e:
            # Log del error para debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error al calcular comisión automática para venta {instance.numero_venta}: {str(e)}')


@receiver(post_save, sender=ComisionCalculada)
def notificar_cambios_comision(sender, instance, created, **kwargs):
    """Envía notificaciones cuando cambia el estado de una comisión"""
    if not created:
        # Verificar si cambió el estado
        try:
            comision_anterior = ComisionCalculada.objects.get(pk=instance.pk)
            if comision_anterior.estado != instance.estado:
                notificacion_service = NotificacionService()
                
                if instance.estado == 'aprobada':
                    # Notificar al vendedor que su comisión fue aprobada
                    pass
                elif instance.estado == 'pagada':
                    # Notificar al vendedor que su comisión fue pagada
                    pass
                    
        except ComisionCalculada.DoesNotExist:
            pass


# Signal para limpiar archivos huérfanos cuando se elimina un documento
@receiver(pre_save, sender='financiamiento.DocumentoCredito')
def limpiar_archivo_anterior(sender, instance, **kwargs):
    """Limpia archivo anterior cuando se actualiza un documento"""
    if instance.pk:
        try:
            documento_anterior = sender.objects.get(pk=instance.pk)
            if documento_anterior.archivo != instance.archivo:
                # Eliminar archivo anterior
                if documento_anterior.archivo:
                    documento_anterior.archivo.delete(save=False)
        except sender.DoesNotExist:
            pass


# Signal para validaciones adicionales
@receiver(pre_save, sender=SolicitudCredito)
def validar_solicitud_credito(sender, instance, **kwargs):
    """Validaciones adicionales antes de guardar una solicitud"""
    # Validar que la cuota inicial no supere el monto solicitado
    if instance.monto_inicial >= instance.monto_solicitado:
        raise ValueError("La cuota inicial debe ser menor al monto solicitado")
    
    # Validar que el plazo esté dentro de los límites de la entidad financiera
    if (instance.plazo_meses < instance.entidad_financiera.plazo_minimo or 
        instance.plazo_meses > instance.entidad_financiera.plazo_maximo):
        raise ValueError(
            f"El plazo debe estar entre {instance.entidad_financiera.plazo_minimo} "
            f"y {instance.entidad_financiera.plazo_maximo} meses"
        )
    
    # Validar que el monto esté dentro de los límites
    if (instance.monto_solicitado < instance.entidad_financiera.monto_minimo or 
        instance.monto_solicitado > instance.entidad_financiera.monto_maximo):
        raise ValueError(
            f"El monto debe estar entre ${instance.entidad_financiera.monto_minimo:,.0f} "
            f"y ${instance.entidad_financiera.monto_maximo:,.0f}"
        )
    
    # Validar porcentaje de cuota inicial si es requerida
    if instance.entidad_financiera.requiere_inicial:
        porcentaje_inicial = (instance.monto_inicial / instance.monto_solicitado) * 100
        if porcentaje_inicial < instance.entidad_financiera.porcentaje_inicial_minimo:
            raise ValueError(
                f"La cuota inicial debe ser mínimo el {instance.entidad_financiera.porcentaje_inicial_minimo}% "
                f"del monto solicitado"
            )