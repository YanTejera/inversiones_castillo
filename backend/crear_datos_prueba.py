#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'concesionario_app.settings')
django.setup()

from usuarios.models import Cliente, Usuario
from motos.models import Moto, MotoModelo, MotoInventario
from ventas.models import Venta, VentaDetalle
from pagos.models import CuotaVencimiento, AlertaPago
from datetime import date, timedelta
from decimal import Decimal

def main():
    print('=== CREANDO DATOS DE PRUEBA PARA COBROS ===')

    # Obtener datos existentes
    cliente = Cliente.objects.filter(cedula='123456789').first()
    if not cliente:
        print('Cliente no encontrado, creando...')
        cliente = Cliente.objects.create(
            cedula='123456789',
            nombre='Juan Carlos',
            apellido='Pérez González',
            direccion='Calle Principal 123',
            ciudad='Santo Domingo',
            pais='República Dominicana',
            telefono='809-555-0123',
            celular='829-555-0123',
            email='juan.perez@email.com',
            estado_civil='casado',
            ocupacion='Comerciante',
            ingresos=Decimal('50000.00')
        )
    
    print(f'Cliente: {cliente.nombre} {cliente.apellido} (ID: {cliente.id})')

    usuario = Usuario.objects.filter(is_superuser=True).first()
    if not usuario:
        print('Creando usuario admin...')
        usuario = Usuario.objects.create_superuser('admin', 'admin@test.com', 'admin123')
    
    print(f'Usuario: {usuario.username}')

    # Obtener moto individual disponible
    moto = Moto.objects.filter(activa=True).first()
    if not moto:
        # Usar cualquier moto disponible
        moto = Moto.objects.first()
        if not moto:
            print('No hay motos disponibles, creando una...')
            moto = Moto.objects.create(
                marca='Honda',
                modelo='XR150',
                ano=2024,
                condicion='nueva',
                color='Rojo',
                chasis='TEST123456789',
                precio_compra=Decimal('180000.00'),
                precio_venta=Decimal('250000.00'),
                cantidad_stock=1,
                activa=True
            )

    print(f'Moto: {moto.marca} {moto.modelo} - Chasis: {moto.chasis}')

    # Verificar si ya existe una venta para este cliente
    venta_existente = Venta.objects.filter(cliente=cliente, estado='activa').first()
    if venta_existente:
        print(f'Ya existe venta para el cliente: Venta #{venta_existente.id}')
        print(f'Estado: {venta_existente.estado}')
        print(f'Tipo: {venta_existente.tipo_venta}')
        print(f'Monto total: ${venta_existente.monto_total}')
        print(f'Cuotas: {venta_existente.cuotas}')
        venta = venta_existente
    else:
        # Crear venta financiada con fecha en el pasado (hace 4 meses)
        fecha_venta = date.today() - timedelta(days=120)
        
        venta = Venta.objects.create(
            cliente=cliente,
            usuario=usuario,
            fecha_venta=fecha_venta,
            tipo_venta='financiado',
            monto_total=Decimal('250000.00'),
            monto_inicial=Decimal('50000.00'),
            cuotas=12,
            tasa_interes=Decimal('15.00'),
            pago_mensual=Decimal('18500.00'),
            monto_total_con_intereses=Decimal('272000.00'),
            estado='activa'
        )
        
        # Crear detalle de venta
        VentaDetalle.objects.create(
            venta=venta,
            moto=moto,
            cantidad=1,
            precio_unitario=Decimal('250000.00'),
            subtotal=Decimal('250000.00')
        )
        
        print(f'Venta creada: #{venta.id}')
        print(f'Fecha: {venta.fecha_venta}')
        print(f'Cliente: {venta.cliente.nombre} {venta.cliente.apellido}')
        print(f'Monto: ${venta.monto_total}')
        print(f'Cuotas: {venta.cuotas}')

    # Verificar cuotas existentes
    cuotas_existentes = venta.cuotas_programadas.count()
    if cuotas_existentes == 0:
        print('Generando cuotas...')
        CuotaVencimiento.generar_cuotas_venta(venta)
        cuotas_creadas = venta.cuotas_programadas.count()
        print(f'Cuotas generadas: {cuotas_creadas}')
    else:
        print(f'Ya existen {cuotas_existentes} cuotas')

    # Verificar y modificar fechas de cuotas para crear vencimientos
    cuotas = venta.cuotas_programadas.all().order_by('numero_cuota')
    print('Modificando fechas de cuotas para simular vencimientos...')
    
    hoy = date.today()
    for i, cuota in enumerate(cuotas[:4]):  # Hacer que las primeras 4 cuotas estén vencidas
        # Cuota 1: vencida hace 60 días
        # Cuota 2: vencida hace 30 días  
        # Cuota 3: vencida hace 15 días
        # Cuota 4: vencida hace 5 días
        dias_atras = [60, 30, 15, 5][i]
        nueva_fecha = hoy - timedelta(days=dias_atras)
        cuota.fecha_vencimiento = nueva_fecha
        cuota.estado = 'vencida'  # Marcar como vencida
        cuota.save()
        print(f'  - Cuota #{cuota.numero_cuota}: {cuota.fecha_vencimiento} ({dias_atras} días vencida)')

    # También hacer que una cuota esté próxima a vencer (en 3 días)
    if len(cuotas) > 4:
        cuota_proxima = cuotas[4]
        cuota_proxima.fecha_vencimiento = hoy + timedelta(days=3)
        cuota_proxima.save()
        print(f'  - Cuota #{cuota_proxima.numero_cuota}: {cuota_proxima.fecha_vencimiento} (vence en 3 días)')

    # Verificar cuotas vencidas después de modificar
    cuotas_vencidas = venta.cuotas_programadas.filter(
        fecha_vencimiento__lt=date.today(),
        estado__in=['pendiente', 'parcial', 'vencida']
    )
    print(f'Cuotas vencidas después de modificar: {cuotas_vencidas.count()}')

    # Generar alertas automáticas
    print('\n=== GENERANDO ALERTAS AUTOMÁTICAS ===')
    alertas_antes = AlertaPago.objects.count()
    print(f'Alertas antes: {alertas_antes}')
    
    AlertaPago.generar_alertas_automaticas()
    
    alertas_despues = AlertaPago.objects.count()
    print(f'Alertas después: {alertas_despues}')
    print(f'Alertas nuevas generadas: {alertas_despues - alertas_antes}')

    # Mostrar alertas creadas
    alertas_activas = AlertaPago.objects.filter(estado='activa')
    print(f'\nAlertas activas: {alertas_activas.count()}')
    for alerta in alertas_activas:
        print(f'  - {alerta.get_tipo_alerta_display()}: {alerta.mensaje[:80]}...')

    print('\n=== RESUMEN FINAL ===')
    print(f'Cliente: {cliente.nombre} {cliente.apellido}')
    print(f'Venta: #{venta.id} ({venta.tipo_venta})')
    print(f'Cuotas totales: {venta.cuotas_programadas.count()}')
    print(f'Cuotas vencidas: {cuotas_vencidas.count()}')
    print(f'Alertas activas: {alertas_activas.count()}')
    print('¡Datos de prueba creados exitosamente!')

if __name__ == '__main__':
    main()