from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from ventas.models import Venta
from pagos.models import CuotaVencimiento
from motos.models import Moto
from usuarios.models import Cliente
from .models import Notificacion


@receiver(post_save, sender=Venta)
def crear_notificacion_nueva_venta(sender, instance, created, **kwargs):
    """Crear notificación cuando se registra una nueva venta"""
    if created:
        Notificacion.crear_notificacion(
            tipo='nueva_venta',
            titulo=f'Nueva Venta Registrada - #{instance.id}',
            mensaje=f'Se registró una nueva venta por ${instance.monto_total:,.0f} para {instance.cliente.nombre} {instance.cliente.apellido}',
            prioridad='media',
            datos_adicionales={
                'venta_id': instance.id,
                'cliente_id': instance.cliente.id,
                'monto_total': float(instance.monto_total)
            }
        )


@receiver(post_save, sender=CuotaVencimiento)
def crear_notificacion_pago_recibido(sender, instance, created, **kwargs):
    """Crear notificación cuando se registra un pago de cuota"""
    if not created:  # Solo cuando se actualiza una cuota existente
        # Verificar si cambió el estado a pagada
        if instance.estado == 'pagada':
            try:
                # Obtener la instancia previa para comparar
                cuota_anterior = CuotaVencimiento.objects.get(id=instance.id)
                if hasattr(cuota_anterior, '_estado_anterior') and cuota_anterior._estado_anterior != 'pagada':
                    Notificacion.crear_notificacion(
                        tipo='pago_recibido',
                        titulo=f'Pago Recibido - {instance.venta.cliente.nombre} {instance.venta.cliente.apellido}',
                        mensaje=f'Se recibió el pago de la cuota #{instance.numero_cuota} por ${instance.monto_pagado:,.0f}',
                        prioridad='media',
                        datos_adicionales={
                            'cuota_id': instance.id,
                            'venta_id': instance.venta.id,
                            'cliente_id': instance.venta.cliente.id,
                            'numero_cuota': instance.numero_cuota,
                            'monto_pagado': float(instance.monto_pagado)
                        }
                    )
            except CuotaVencimiento.DoesNotExist:
                pass


@receiver(pre_save, sender=CuotaVencimiento)
def guardar_estado_anterior_cuota(sender, instance, **kwargs):
    """Guardar el estado anterior de la cuota para comparar en post_save"""
    if instance.pk:
        try:
            cuota_anterior = CuotaVencimiento.objects.get(pk=instance.pk)
            instance._estado_anterior = cuota_anterior.estado
        except CuotaVencimiento.DoesNotExist:
            instance._estado_anterior = 'pendiente'


@receiver(post_save, sender=CuotaVencimiento)
def verificar_notificacion_pago_actualizada(sender, instance, created, **kwargs):
    """Verificación mejorada para notificaciones de pago"""
    if not created and hasattr(instance, '_estado_anterior'):
        # Solo crear notificación si cambió de no pagada a pagada
        if instance._estado_anterior != 'pagada' and instance.estado == 'pagada':
            Notificacion.crear_notificacion(
                tipo='pago_recibido',
                titulo=f'Pago Recibido - {instance.venta.cliente.nombre} {instance.venta.cliente.apellido}',
                mensaje=f'Se completó el pago de la cuota #{instance.numero_cuota} por ${instance.monto_cuota:,.0f}',
                prioridad='media',
                datos_adicionales={
                    'cuota_id': instance.id,
                    'venta_id': instance.venta.id,
                    'cliente_id': instance.venta.cliente.id,
                    'numero_cuota': instance.numero_cuota,
                    'monto_cuota': float(instance.monto_cuota)
                }
            )


@receiver(post_save, sender=Cliente)
def crear_notificacion_cliente_nuevo(sender, instance, created, **kwargs):
    """Crear notificación cuando se registra un nuevo cliente"""
    if created:
        Notificacion.crear_notificacion(
            tipo='cliente_nuevo',
            titulo=f'Nuevo Cliente Registrado - {instance.nombre} {instance.apellido}',
            mensaje=f'Se registró un nuevo cliente: {instance.nombre} {instance.apellido}',
            prioridad='media',
            datos_adicionales={
                'cliente_id': instance.id,
                'nombre_completo': f'{instance.nombre} {instance.apellido}',
                'documento': instance.documento
            }
        )


@receiver(post_save, sender=Moto)
def crear_notificacion_nueva_moto(sender, instance, created, **kwargs):
    """Crear notificación cuando se registra una nueva moto en inventario"""
    if created:
        Notificacion.crear_notificacion(
            tipo='nueva_moto',
            titulo=f'Nueva Moto en Inventario - {instance.marca} {instance.modelo}',
            mensaje=f'Se agregó una nueva moto al inventario: {instance.marca} {instance.modelo} ({instance.ano})',
            prioridad='media',
            datos_adicionales={
                'moto_id': instance.id,
                'marca': instance.marca,
                'modelo': instance.modelo,
                'ano': instance.ano,
                'precio_venta': float(instance.precio_venta),
                'cantidad_stock': instance.cantidad_stock
            }
        )


# Función para verificar cuotas vencidas y próximas a vencer
def verificar_cuotas_vencidas():
    """
    Función que debe ser llamada periódicamente (ej: tarea cron)
    para verificar cuotas vencidas y próximas a vencer
    """
    from django.db.models import Q
    from datetime import date
    
    hoy = timezone.now().date()
    proximos_7_dias = hoy + timedelta(days=7)
    
    # Verificar cuotas vencidas (no pagadas y fecha pasada)
    cuotas_vencidas = CuotaVencimiento.objects.filter(
        estado__in=['pendiente', 'parcial'],
        fecha_vencimiento__lt=hoy
    ).select_related('venta', 'venta__cliente')
    
    for cuota in cuotas_vencidas:
        # Verificar si ya existe notificación reciente para esta cuota vencida
        notificacion_existe = Notificacion.objects.filter(
            tipo='pago_vencido',
            datos_adicionales__cuota_id=cuota.id,
            fecha_creacion__gte=hoy - timedelta(days=1)  # Última notificación hace menos de 1 día
        ).exists()
        
        if not notificacion_existe:
            dias_vencida = (hoy - cuota.fecha_vencimiento).days
            Notificacion.crear_notificacion(
                tipo='pago_vencido',
                titulo=f'Cuota Vencida - {cuota.venta.cliente.nombre} {cuota.venta.cliente.apellido}',
                mensaje=f'La cuota #{cuota.numero_cuota} está vencida desde hace {dias_vencida} días. Monto: ${cuota.saldo_pendiente:,.0f}',
                prioridad='alta',
                datos_adicionales={
                    'cuota_id': cuota.id,
                    'venta_id': cuota.venta.id,
                    'cliente_id': cuota.venta.cliente.id,
                    'dias_vencida': dias_vencida,
                    'monto_pendiente': float(cuota.saldo_pendiente)
                }
            )
    
    # Verificar cuotas próximas a vencer (en los próximos 7 días)
    cuotas_proximas = CuotaVencimiento.objects.filter(
        estado='pendiente',
        fecha_vencimiento__range=[hoy + timedelta(days=1), proximos_7_dias]
    ).select_related('venta', 'venta__cliente')
    
    for cuota in cuotas_proximas:
        # Verificar si ya existe notificación reciente para esta cuota próxima
        notificacion_existe = Notificacion.objects.filter(
            tipo='pago_proximo',
            datos_adicionales__cuota_id=cuota.id,
            fecha_creacion__gte=hoy - timedelta(days=3)  # Última notificación hace menos de 3 días
        ).exists()
        
        if not notificacion_existe:
            dias_hasta_vencimiento = (cuota.fecha_vencimiento - hoy).days
            Notificacion.crear_notificacion(
                tipo='pago_proximo',
                titulo=f'Pago Próximo a Vencer - {cuota.venta.cliente.nombre} {cuota.venta.cliente.apellido}',
                mensaje=f'La cuota #{cuota.numero_cuota} vence en {dias_hasta_vencimiento} días. Monto: ${cuota.monto_cuota:,.0f}',
                prioridad='media',
                datos_adicionales={
                    'cuota_id': cuota.id,
                    'venta_id': cuota.venta.id,
                    'cliente_id': cuota.venta.cliente.id,
                    'dias_hasta_vencimiento': dias_hasta_vencimiento,
                    'monto_cuota': float(cuota.monto_cuota)
                }
            )


def verificar_stock_bajo():
    """
    Función para verificar motos con stock bajo
    """
    from django.db import models
    
    # Definir stock mínimo (puede ser configurable)
    STOCK_MINIMO = 2
    
    motos_stock_bajo = Moto.objects.filter(
        activa=True,
        cantidad_stock__lte=STOCK_MINIMO
    ).values('marca', 'modelo').annotate(
        total_stock=models.Sum('cantidad_stock')
    ).filter(total_stock__lte=STOCK_MINIMO)
    
    for moto_info in motos_stock_bajo:
        # Verificar si ya existe notificación reciente para este modelo
        notificacion_existe = Notificacion.objects.filter(
            tipo='stock_bajo',
            datos_adicionales__marca=moto_info['marca'],
            datos_adicionales__modelo=moto_info['modelo'],
            fecha_creacion__gte=timezone.now() - timedelta(days=7)  # Última notificación hace menos de 1 semana
        ).exists()
        
        if not notificacion_existe:
            Notificacion.crear_notificacion(
                tipo='stock_bajo',
                titulo=f'Stock Bajo - {moto_info["marca"]} {moto_info["modelo"]}',
                mensaje=f'El modelo {moto_info["marca"]} {moto_info["modelo"]} tiene stock bajo: {moto_info["total_stock"]} unidades',
                prioridad='alta',
                datos_adicionales={
                    'marca': moto_info['marca'],
                    'modelo': moto_info['modelo'],
                    'stock_actual': moto_info['total_stock'],
                    'stock_minimo': STOCK_MINIMO
                }
            )


def generar_alertas_programadas():
    """
    Función principal que ejecuta todas las verificaciones programadas.
    Esta función debe ser llamada por un cron job o task scheduler.
    """
    try:
        verificar_cuotas_vencidas()
        verificar_stock_bajo()
        print(f"Alertas generadas exitosamente: {timezone.now()}")
    except Exception as e:
        print(f"Error generando alertas programadas: {e}")
        # Log error para debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error en generar_alertas_programadas: {e}", exc_info=True)