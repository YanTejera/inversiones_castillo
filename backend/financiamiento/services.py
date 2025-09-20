from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from django.db.models import Sum, Q
from datetime import datetime, timedelta

from .models import (
    SolicitudCredito, ComisionCalculada, EsquemaComision, 
    AsignacionComision, TramosComision
)
from ventas.models import Venta


class CalculadoraFinanciera:
    """Servicio para cálculos financieros"""
    
    def calcular_credito(self, monto, inicial, tasa_anual, plazo_meses):
        """
        Calcula cuota mensual y tabla de amortización usando fórmula francesa
        
        Args:
            monto (Decimal): Monto total del vehículo
            inicial (Decimal): Cuota inicial
            tasa_anual (Decimal): Tasa de interés anual en porcentaje
            plazo_meses (int): Plazo en meses
            
        Returns:
            dict: Resultado del cálculo con cuota, intereses y tabla de amortización
        """
        # Conversiones
        monto = Decimal(str(monto))
        inicial = Decimal(str(inicial))
        tasa_anual = Decimal(str(tasa_anual))
        plazo_meses = int(plazo_meses)
        
        # Validaciones
        if monto <= 0:
            raise ValueError("El monto debe ser mayor a 0")
        if inicial >= monto:
            raise ValueError("La cuota inicial debe ser menor al monto total")
        if tasa_anual < 0:
            raise ValueError("La tasa de interés no puede ser negativa")
        if plazo_meses <= 0:
            raise ValueError("El plazo debe ser mayor a 0")
        
        # Cálculos básicos
        monto_financiar = monto - inicial
        tasa_mensual = tasa_anual / Decimal('100') / Decimal('12')
        
        if tasa_mensual == 0:
            # Sin interés
            cuota_mensual = monto_financiar / plazo_meses
        else:
            # Fórmula de cuota francesa: C = P * [r(1+r)^n] / [(1+r)^n - 1]
            factor = (Decimal('1') + tasa_mensual) ** plazo_meses
            cuota_mensual = monto_financiar * (tasa_mensual * factor) / (factor - Decimal('1'))
        
        # Redondear cuota a 2 decimales
        cuota_mensual = cuota_mensual.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Calcular totales
        total_pagos = cuota_mensual * plazo_meses
        total_intereses = total_pagos - monto_financiar
        total_pagar = total_pagos + inicial
        
        # Generar tabla de amortización
        tabla_amortizacion = self._generar_tabla_amortizacion(
            monto_financiar, cuota_mensual, tasa_mensual, plazo_meses
        )
        
        return {
            'cuota_mensual': float(cuota_mensual),
            'total_intereses': float(total_intereses),
            'total_pagar': float(total_pagar),
            'resumen': {
                'monto_vehiculo': float(monto),
                'inicial': float(inicial),
                'monto_financiar': float(monto_financiar),
                'plazo_meses': plazo_meses,
                'tasa_anual': float(tasa_anual),
                'tasa_mensual': float(tasa_mensual * 100)
            },
            'tabla_amortizacion': tabla_amortizacion
        }
    
    def _generar_tabla_amortizacion(self, capital, cuota, tasa_mensual, plazo):
        """Genera tabla de amortización detallada"""
        tabla = []
        saldo_pendiente = capital
        
        for mes in range(1, plazo + 1):
            if tasa_mensual == 0:
                interes_mes = Decimal('0')
            else:
                interes_mes = saldo_pendiente * tasa_mensual
            
            # En el último mes, ajustar para saldar exactamente
            if mes == plazo:
                capital_mes = saldo_pendiente
                cuota_real = capital_mes + interes_mes
            else:
                capital_mes = cuota - interes_mes
                cuota_real = cuota
            
            saldo_pendiente -= capital_mes
            
            # Asegurar que el saldo no sea negativo por redondeo
            if saldo_pendiente < Decimal('0.01'):
                saldo_pendiente = Decimal('0')
            
            tabla.append({
                'mes': mes,
                'cuota': float(cuota_real.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'capital': float(capital_mes.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'interes': float(interes_mes.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'saldo': float(saldo_pendiente.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            })
        
        return tabla
    
    def calcular_capacidad_pago(self, ingresos_mensuales, gastos_mensuales, 
                               porcentaje_endeudamiento=30):
        """
        Calcula la capacidad de pago de un cliente
        
        Args:
            ingresos_mensuales (Decimal): Ingresos mensuales del cliente
            gastos_mensuales (Decimal): Gastos mensuales del cliente
            porcentaje_endeudamiento (int): Porcentaje máximo de endeudamiento
            
        Returns:
            dict: Capacidad de pago y análisis
        """
        ingresos = Decimal(str(ingresos_mensuales))
        gastos = Decimal(str(gastos_mensuales))
        porcentaje = Decimal(str(porcentaje_endeudamiento)) / Decimal('100')
        
        ingresos_disponibles = ingresos - gastos
        capacidad_cuota = ingresos * porcentaje
        capacidad_real = min(ingresos_disponibles, capacidad_cuota)
        
        return {
            'ingresos_mensuales': float(ingresos),
            'gastos_mensuales': float(gastos),
            'ingresos_disponibles': float(ingresos_disponibles),
            'capacidad_cuota_teorica': float(capacidad_cuota),
            'capacidad_cuota_real': float(capacidad_real),
            'porcentaje_endeudamiento': float(porcentaje * 100),
            'viable': capacidad_real > 0
        }


class ComisionService:
    """Servicio para cálculo y gestión de comisiones"""
    
    def calcular_comision_venta(self, venta):
        """
        Calcula la comisión para una venta específica
        
        Args:
            venta (Venta): Instancia de la venta
            
        Returns:
            ComisionCalculada: Comisión calculada
        """
        # Obtener asignación de comisión activa del vendedor
        asignacion = self._obtener_asignacion_activa(venta.vendedor, venta.fecha_venta)
        
        if not asignacion:
            raise ValueError(f"No hay esquema de comisión asignado para {venta.vendedor.get_full_name()}")
        
        esquema = asignacion.esquema
        
        # Calcular montos base
        monto_venta = venta.precio_total
        monto_utilidad = self._calcular_utilidad_venta(venta)
        
        # Aplicar cálculo según tipo de esquema
        if esquema.tipo_esquema == 'porcentaje_venta':
            comision_base = self._calcular_por_porcentaje_venta(
                monto_venta, esquema, asignacion
            )
        elif esquema.tipo_esquema == 'porcentaje_utilidad':
            comision_base = self._calcular_por_porcentaje_utilidad(
                monto_utilidad, esquema, asignacion
            )
        elif esquema.tipo_esquema == 'monto_fijo':
            comision_base = esquema.monto_fijo
        elif esquema.tipo_esquema == 'escalado':
            comision_base = self._calcular_escalado(venta.vendedor, monto_venta, esquema)
        else:
            comision_base = Decimal('0')
        
        # Calcular comisión por financiamiento si aplica
        comision_financiamiento = Decimal('0')
        if esquema.incluye_financiamiento and self._tiene_financiamiento(venta):
            comision_financiamiento = monto_venta * (esquema.porcentaje_financiamiento / Decimal('100'))
        
        comision_total = comision_base + comision_financiamiento
        
        # Determinar porcentaje aplicado para registro
        if monto_venta > 0:
            porcentaje_aplicado = (comision_base / monto_venta) * Decimal('100')
        else:
            porcentaje_aplicado = Decimal('0')
        
        # Crear registro de comisión
        comision = ComisionCalculada.objects.create(
            venta=venta,
            vendedor=venta.vendedor,
            esquema_aplicado=esquema,
            monto_venta=monto_venta,
            monto_utilidad=monto_utilidad,
            porcentaje_aplicado=porcentaje_aplicado,
            comision_venta=comision_base,
            comision_financiamiento=comision_financiamiento,
            comision_total=comision_total
        )
        
        return comision
    
    def _obtener_asignacion_activa(self, vendedor, fecha_venta):
        """Obtiene la asignación de comisión activa para un vendedor en una fecha"""
        return AsignacionComision.objects.filter(
            vendedor=vendedor,
            activa=True,
            fecha_inicio__lte=fecha_venta
        ).filter(
            Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=fecha_venta)
        ).first()
    
    def _calcular_utilidad_venta(self, venta):
        """Calcula la utilidad de una venta"""
        # Obtener costo total de las motocicletas vendidas
        costo_total = Decimal('0')
        
        for item in venta.items.all():
            if hasattr(item.motocicleta, 'precio_compra'):
                costo_total += item.motocicleta.precio_compra or Decimal('0')
            else:
                # Si no hay precio de compra, usar un margen estimado del 20%
                costo_estimado = venta.precio_total * Decimal('0.8')
                costo_total += costo_estimado
        
        utilidad = venta.precio_total - costo_total
        return max(utilidad, Decimal('0'))  # No utilidades negativas
    
    def _calcular_por_porcentaje_venta(self, monto_venta, esquema, asignacion):
        """Calcula comisión por porcentaje sobre venta"""
        porcentaje = asignacion.porcentaje_personalizado or esquema.porcentaje_base
        return monto_venta * (porcentaje / Decimal('100'))
    
    def _calcular_por_porcentaje_utilidad(self, monto_utilidad, esquema, asignacion):
        """Calcula comisión por porcentaje sobre utilidad"""
        porcentaje = asignacion.porcentaje_personalizado or esquema.porcentaje_base
        return monto_utilidad * (porcentaje / Decimal('100'))
    
    def _calcular_escalado(self, vendedor, monto_venta, esquema):
        """Calcula comisión escalada por metas"""
        # Obtener estadísticas del vendedor para el mes actual
        fecha_actual = timezone.now().date()
        inicio_mes = fecha_actual.replace(day=1)
        fin_mes = self._ultimo_dia_mes(fecha_actual)
        
        # Calcular ventas del mes
        ventas_mes = Venta.objects.filter(
            vendedor=vendedor,
            fecha_venta__range=[inicio_mes, fin_mes],
            estado='completada'
        )
        
        total_unidades = ventas_mes.count()
        total_monto = ventas_mes.aggregate(Sum('precio_total'))['precio_total__sum'] or Decimal('0')
        
        # Incluir la venta actual
        total_unidades += 1
        total_monto += monto_venta
        
        # Buscar tramo aplicable
        tramo = esquema.tramos.filter(
            desde_unidades__lte=total_unidades,
            desde_monto__lte=total_monto
        ).filter(
            Q(hasta_unidades__isnull=True) | Q(hasta_unidades__gte=total_unidades)
        ).filter(
            Q(hasta_monto__isnull=True) | Q(hasta_monto__gte=total_monto)
        ).first()
        
        if tramo:
            comision = monto_venta * (tramo.porcentaje / Decimal('100')) + tramo.monto_fijo
        else:
            # Si no hay tramo, usar valores base del esquema
            comision = monto_venta * (esquema.porcentaje_base / Decimal('100')) + esquema.monto_fijo
        
        return comision
    
    def _tiene_financiamiento(self, venta):
        """Verifica si una venta tiene financiamiento"""
        return hasattr(venta, 'solicitudes_credito') and \
               venta.solicitudes_credito.filter(estado='desembolsada').exists()
    
    def _ultimo_dia_mes(self, fecha):
        """Obtiene el último día del mes para una fecha"""
        import calendar
        ultimo_dia = calendar.monthrange(fecha.year, fecha.month)[1]
        return fecha.replace(day=ultimo_dia)
    
    def recalcular_comisiones_periodo(self, fecha_inicio, fecha_fin, vendedor_id=None):
        """
        Recalcula comisiones para un período específico
        
        Args:
            fecha_inicio (date): Fecha de inicio
            fecha_fin (date): Fecha de fin  
            vendedor_id (int, optional): ID del vendedor específico
            
        Returns:
            dict: Resultado del recálculo
        """
        ventas = Venta.objects.filter(
            fecha_venta__range=[fecha_inicio, fecha_fin],
            estado='completada'
        )
        
        if vendedor_id:
            ventas = ventas.filter(vendedor_id=vendedor_id)
        
        recalculadas = 0
        errores = []
        
        for venta in ventas:
            try:
                # Eliminar comisión existente si existe
                if hasattr(venta, 'comision'):
                    venta.comision.delete()
                
                # Recalcular
                self.calcular_comision_venta(venta)
                recalculadas += 1
                
            except Exception as e:
                errores.append(f"Error en venta {venta.numero_venta}: {str(e)}")
        
        return {
            'total_ventas': ventas.count(),
            'recalculadas': recalculadas,
            'errores': errores
        }
    
    def obtener_ranking_vendedores(self, fecha_inicio, fecha_fin):
        """
        Obtiene ranking de vendedores por comisiones en un período
        
        Args:
            fecha_inicio (date): Fecha de inicio
            fecha_fin (date): Fecha de fin
            
        Returns:
            list: Lista de vendedores ordenados por comisiones
        """
        from django.contrib.auth import get_user_model
        from django.db.models import Sum, Count, Avg
        
        User = get_user_model()
        
        ranking = User.objects.filter(
            comisiones__fecha_calculo__date__range=[fecha_inicio, fecha_fin]
        ).annotate(
            total_comisiones=Sum('comisiones__comision_total'),
            total_ventas=Count('comisiones'),
            comision_promedio=Avg('comisiones__comision_total'),
            monto_total_ventas=Sum('comisiones__monto_venta')
        ).filter(
            total_comisiones__gt=0
        ).order_by('-total_comisiones')
        
        return [
            {
                'vendedor_id': vendedor.id,
                'vendedor_nombre': vendedor.get_full_name(),
                'total_comisiones': float(vendedor.total_comisiones or 0),
                'total_ventas': vendedor.total_ventas or 0,
                'comision_promedio': float(vendedor.comision_promedio or 0),
                'monto_total_ventas': float(vendedor.monto_total_ventas or 0)
            }
            for vendedor in ranking
        ]


class NotificacionService:
    """Servicio para notificaciones del módulo de financiamiento"""
    
    def notificar_solicitud_aprobada(self, solicitud):
        """Envía notificación cuando se aprueba una solicitud"""
        # TODO: Implementar notificaciones (email, SMS, push)
        pass
    
    def notificar_solicitud_rechazada(self, solicitud):
        """Envía notificación cuando se rechaza una solicitud"""
        # TODO: Implementar notificaciones
        pass
    
    def notificar_documento_pendiente(self, solicitud):
        """Envía notificación de documentos pendientes"""
        # TODO: Implementar notificaciones
        pass
    
    def notificar_comision_calculada(self, comision):
        """Envía notificación cuando se calcula una comisión"""
        # TODO: Implementar notificaciones
        pass