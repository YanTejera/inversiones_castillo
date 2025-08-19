#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'concesionario_app.settings')
django.setup()

from usuarios.models import Cliente, Usuario
from motos.models import Moto
from ventas.models import Venta, VentaDetalle
from pagos.models import CuotaVencimiento, AlertaPago, Pago
from datetime import date, timedelta
from decimal import Decimal
import random

def main():
    print('=== CREANDO MÁS DATOS DE PRUEBA PARA COBROS ===')

    usuario = Usuario.objects.filter(is_superuser=True).first()
    motos = list(Moto.objects.all()[:3])  # Usar las primeras 3 motos
    
    # Crear varios clientes con diferentes estados
    clientes_data = [
        {
            'nombre': 'María',
            'apellido': 'Rodríguez Santos',
            'cedula': '987654321',
            'telefono': '809-555-0456',
            'estado_cuotas': 'al_dia',  # Cliente al día
            'dias_venta': 30
        },
        {
            'nombre': 'Pedro',
            'apellido': 'Martínez López',
            'cedula': '456789123',
            'telefono': '829-555-0789',
            'estado_cuotas': 'proximo_vencer',  # Próximo a vencer
            'dias_venta': 60
        },
        {
            'nombre': 'Ana',
            'apellido': 'García Fernández',
            'cedula': '321654987',
            'telefono': '849-555-0321',
            'estado_cuotas': 'muy_atrasado',  # Muy atrasado
            'dias_venta': 150
        },
        {
            'nombre': 'Luis',
            'apellido': 'Herrera Cruz',
            'cedula': '654321789',
            'telefono': '809-555-0654',
            'estado_cuotas': 'poco_atrasado',  # Poco atrasado
            'dias_venta': 90
        }
    ]

    for i, cliente_data in enumerate(clientes_data):
        # Crear cliente si no existe
        cliente, created = Cliente.objects.get_or_create(
            cedula=cliente_data['cedula'],
            defaults={
                'nombre': cliente_data['nombre'],
                'apellido': cliente_data['apellido'],
                'direccion': f'Avenida Principal {100 + i}',
                'ciudad': 'Santo Domingo',
                'pais': 'República Dominicana',
                'telefono': cliente_data['telefono'],
                'celular': cliente_data['telefono'].replace('809', '829'),
                'email': f'{cliente_data["nombre"].lower()}.{cliente_data["apellido"].lower().split()[0]}@email.com',
                'estado_civil': random.choice(['soltero', 'casado', 'divorciado']),
                'ocupacion': random.choice(['Empleado', 'Comerciante', 'Profesional', 'Independiente']),
                'ingresos': Decimal(str(random.randint(25000, 80000)))
            }
        )

        print(f'Cliente: {cliente.nombre} {cliente.apellido} ({"creado" if created else "existente"})')

        # Verificar si ya tiene venta
        if Venta.objects.filter(cliente=cliente, estado='activa').exists():
            print(f'  - Ya tiene venta activa')
            continue

        # Crear venta financiada
        moto = random.choice(motos)
        dias_atras = cliente_data['dias_venta']
        fecha_venta = date.today() - timedelta(days=dias_atras)
        
        monto_base = random.randint(200000, 400000)
        monto_inicial = monto_base * Decimal('0.2')  # 20% inicial
        cuotas = random.choice([12, 18, 24])
        tasa_interes = Decimal('15.00')
        
        # Calcular pagos
        monto_financiado = monto_base - monto_inicial
        interes_total = monto_financiado * (tasa_interes / 100)
        monto_con_intereses = monto_base + interes_total
        pago_mensual = monto_con_intereses / cuotas

        venta = Venta.objects.create(
            cliente=cliente,
            usuario=usuario,
            fecha_venta=fecha_venta,
            tipo_venta='financiado',
            monto_total=Decimal(str(monto_base)),
            monto_inicial=monto_inicial,
            cuotas=cuotas,
            tasa_interes=tasa_interes,
            pago_mensual=pago_mensual,
            monto_total_con_intereses=monto_con_intereses,
            estado='activa'
        )

        # Crear detalle de venta
        VentaDetalle.objects.create(
            venta=venta,
            moto=moto,
            cantidad=1,
            precio_unitario=Decimal(str(monto_base)),
            subtotal=Decimal(str(monto_base))
        )

        print(f'  - Venta creada: #{venta.id} (${monto_base:,.0f}, {cuotas} cuotas)')

        # Generar cuotas
        CuotaVencimiento.generar_cuotas_venta(venta)

        # Modificar fechas según el estado deseado
        cuotas_obj = venta.cuotas_programadas.all().order_by('numero_cuota')
        hoy = date.today()

        if cliente_data['estado_cuotas'] == 'al_dia':
            # Todas las cuotas en el futuro, simular que ha pagado algunas
            for j, cuota in enumerate(cuotas_obj[:3]):  # Pagar las primeras 3 cuotas
                cuota.monto_pagado = cuota.monto_cuota
                cuota.estado = 'pagada'
                cuota.save()
                
                # Crear registro de pago
                Pago.objects.create(
                    venta=venta,
                    fecha_pago=fecha_venta + timedelta(days=30 * (j + 1)),
                    monto_pagado=cuota.monto_cuota,
                    tipo_pago='transferencia',
                    observaciones=f'Pago cuota #{cuota.numero_cuota}',
                    usuario_cobrador=usuario,
                    estado='activo'
                )
            print(f'  - Cliente al día: 3 cuotas pagadas')

        elif cliente_data['estado_cuotas'] == 'proximo_vencer':
            # Próxima cuota vence en 5 días
            if len(cuotas_obj) > 0:
                cuota_proxima = cuotas_obj[0]
                cuota_proxima.fecha_vencimiento = hoy + timedelta(days=5)
                cuota_proxima.save()
            print(f'  - Cliente próximo a vencer: cuota vence en 5 días')

        elif cliente_data['estado_cuotas'] == 'poco_atrasado':
            # 1-2 cuotas vencidas
            for j, cuota in enumerate(cuotas_obj[:2]):
                dias_vencida = [15, 8][j]  # 15 y 8 días atrás
                cuota.fecha_vencimiento = hoy - timedelta(days=dias_vencida)
                cuota.estado = 'vencida'
                cuota.save()
            print(f'  - Cliente poco atrasado: 2 cuotas vencidas')

        elif cliente_data['estado_cuotas'] == 'muy_atrasado':
            # 4+ cuotas vencidas
            for j, cuota in enumerate(cuotas_obj[:5]):
                dias_vencida = [90, 60, 30, 15, 7][j]  # Muy atrasado
                cuota.fecha_vencimiento = hoy - timedelta(days=dias_vencida)
                cuota.estado = 'vencida'
                cuota.save()
            print(f'  - Cliente muy atrasado: 5 cuotas vencidas')

    # Generar alertas para todos los datos nuevos
    print('\n=== GENERANDO ALERTAS PARA TODOS LOS DATOS ===')
    alertas_antes = AlertaPago.objects.count()
    AlertaPago.generar_alertas_automaticas()
    alertas_despues = AlertaPago.objects.count()
    print(f'Alertas generadas: {alertas_despues - alertas_antes}')

    # Resumen final
    print('\n=== RESUMEN FINAL ===')
    total_clientes = Cliente.objects.count()
    total_ventas = Venta.objects.filter(estado='activa').count()
    total_cuotas_vencidas = CuotaVencimiento.objects.filter(
        fecha_vencimiento__lt=date.today(),
        estado__in=['pendiente', 'parcial', 'vencida']
    ).count()
    total_alertas = AlertaPago.objects.filter(estado='activa').count()

    print(f'Total clientes: {total_clientes}')
    print(f'Total ventas activas: {total_ventas}')
    print(f'Total cuotas vencidas: {total_cuotas_vencidas}')
    print(f'Total alertas activas: {total_alertas}')
    print('¡Datos adicionales de prueba creados exitosamente!')

if __name__ == '__main__':
    main()