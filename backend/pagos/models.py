from django.db import models
from django.conf import settings
from django.utils import timezone
from ventas.models import Venta
from datetime import datetime, timedelta

class Pago(models.Model):
    TIPO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
        ('cheque', 'Cheque'),
    ]
    
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='pagos')
    fecha_pago = models.DateTimeField(auto_now_add=True)
    monto_pagado = models.DecimalField(max_digits=15, decimal_places=2)
    tipo_pago = models.CharField(max_length=20, choices=TIPO_PAGO_CHOICES)
    observaciones = models.TextField(blank=True, null=True)
    usuario_cobrador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cobros_realizados')
    
    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago']
    
    def __str__(self):
        return f"Pago {self.id} - Venta {self.venta.id} - ${self.monto_pagado}"
    
    def save(self, *args, **kwargs):
        """
        Al guardar un pago, actualizar automáticamente las cuotas de vencimiento
        """
        super().save(*args, **kwargs)
        self.actualizar_cuotas_vencimiento()
    
    def actualizar_cuotas_vencimiento(self):
        """
        Distribuye el monto del pago entre las cuotas pendientes, comenzando por las más antiguas
        """
        cuotas_pendientes = self.venta.cuotas_programadas.filter(
            estado__in=['pendiente', 'parcial', 'vencida']
        ).order_by('numero_cuota')
        
        # Calcular el total de pagos ya distribuidos
        total_pagos_distribuidos = sum(
            cuota.monto_pagado for cuota in self.venta.cuotas_programadas.all()
        )
        
        # Calcular total de pagos realizados
        total_pagos = sum(
            pago.monto_pagado for pago in self.venta.pagos.all()
        )
        
        # Si hay diferencia, redistribuir
        monto_por_distribuir = total_pagos - total_pagos_distribuidos
        
        if monto_por_distribuir > 0:
            for cuota in cuotas_pendientes:
                if monto_por_distribuir <= 0:
                    break
                
                saldo_cuota = cuota.monto_cuota - cuota.monto_pagado
                
                if saldo_cuota > 0:
                    monto_aplicar = min(monto_por_distribuir, saldo_cuota)
                    cuota.monto_pagado += monto_aplicar
                    monto_por_distribuir -= monto_aplicar
                    
                    # Actualizar estado de la cuota
                    cuota.actualizar_estado_por_pagos()
                    cuota.save()

class CuotaVencimiento(models.Model):
    """
    Modelo para realizar seguimiento de las cuotas programadas de ventas financiadas
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagada', 'Pagada'),
        ('parcial', 'Pago Parcial'),
        ('vencida', 'Vencida'),
    ]
    
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='cuotas_programadas')
    numero_cuota = models.PositiveIntegerField(help_text="Número de cuota (1, 2, 3...)")
    fecha_vencimiento = models.DateField(help_text="Fecha de vencimiento de la cuota")
    monto_cuota = models.DecimalField(max_digits=15, decimal_places=2, help_text="Monto de la cuota mensual")
    monto_pagado = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Monto ya pagado de esta cuota")
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Cuota de Vencimiento'
        verbose_name_plural = 'Cuotas de Vencimiento'
        ordering = ['venta', 'numero_cuota']
        unique_together = ['venta', 'numero_cuota']
    
    def __str__(self):
        return f"Venta {self.venta.id} - Cuota {self.numero_cuota} - {self.get_estado_display()}"
    
    @property
    def saldo_pendiente(self):
        """Retorna el saldo pendiente de esta cuota"""
        return self.monto_cuota - self.monto_pagado
    
    @property
    def esta_vencida(self):
        """Verifica si la cuota está vencida"""
        return self.fecha_vencimiento < datetime.now().date() and self.estado in ['pendiente', 'parcial']
    
    @property
    def dias_vencido(self):
        """Retorna el número de días vencidos, 0 si no está vencida"""
        if not self.esta_vencida:
            return 0
        return (datetime.now().date() - self.fecha_vencimiento).days
    
    @property
    def tiene_mora(self):
        """Verifica si tiene mora (más de 30 días vencida)"""
        return self.dias_vencido > 30
    
    @property
    def monto_mora(self):
        """Calcula el monto de mora basado en días vencidos"""
        if not self.tiene_mora:
            return 0
        
        # Mora del 2% mensual sobre el saldo pendiente por cada mes vencido
        meses_mora = self.dias_vencido // 30
        tasa_mora_mensual = 0.02  # 2% mensual
        return float(self.saldo_pendiente) * tasa_mora_mensual * meses_mora
    
    @classmethod
    def generar_cuotas_venta(cls, venta):
        """
        Genera automáticamente las cuotas para una venta financiada
        """
        if venta.tipo_venta != 'financiado' or venta.cuotas <= 0:
            return
        
        # Eliminar cuotas existentes si las hay
        cls.objects.filter(venta=venta).delete()
        
        # Calcular la fecha de la primera cuota (un mes después de la venta)
        fecha_venta = venta.fecha_venta.date()
        if fecha_venta.month == 12:
            fecha_primera_cuota = fecha_venta.replace(year=fecha_venta.year + 1, month=1)
        else:
            fecha_primera_cuota = fecha_venta.replace(month=fecha_venta.month + 1)
        
        for numero_cuota in range(1, venta.cuotas + 1):
            # Calcular fecha de vencimiento agregando meses
            mes_vencimiento = fecha_primera_cuota.month + numero_cuota - 1
            ano_vencimiento = fecha_primera_cuota.year
            
            while mes_vencimiento > 12:
                mes_vencimiento -= 12
                ano_vencimiento += 1
            
            try:
                fecha_vencimiento = fecha_primera_cuota.replace(year=ano_vencimiento, month=mes_vencimiento)
            except ValueError:
                # Manejar casos donde el día no existe (ej. 31 de febrero)
                fecha_vencimiento = fecha_primera_cuota.replace(year=ano_vencimiento, month=mes_vencimiento, day=28)
            
            cuota = cls.objects.create(
                venta=venta,
                numero_cuota=numero_cuota,
                fecha_vencimiento=fecha_vencimiento,
                monto_cuota=venta.pago_mensual,
                estado='pendiente'
            )
    
    def actualizar_estado_por_pagos(self):
        """
        Actualiza el estado de la cuota basado en los pagos realizados
        """
        if self.monto_pagado >= self.monto_cuota:
            self.estado = 'pagada'
        elif self.monto_pagado > 0:
            self.estado = 'parcial'
        elif self.esta_vencida:
            self.estado = 'vencida'
        else:
            self.estado = 'pendiente'
        
        self.save()

class AlertaPago(models.Model):
    """
    Modelo para gestionar alertas de pagos vencidos y próximos a vencer
    """
    TIPO_ALERTA_CHOICES = [
        ('proximo_vencer', 'Próximo a Vencer'),
        ('vencida', 'Cuota Vencida'),
        ('multiple_vencidas', 'Múltiples Cuotas Vencidas'),
    ]
    
    ESTADO_CHOICES = [
        ('activa', 'Activa'),
        ('leida', 'Leída'),
        ('resuelta', 'Resuelta'),
    ]
    
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='alertas_pago')
    cuota = models.ForeignKey(CuotaVencimiento, on_delete=models.CASCADE, related_name='alertas', null=True, blank=True)
    tipo_alerta = models.CharField(max_length=20, choices=TIPO_ALERTA_CHOICES)
    mensaje = models.TextField(help_text="Mensaje descriptivo de la alerta")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_lectura = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activa')
    usuario_asignado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alertas_asignadas', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Alerta de Pago'
        verbose_name_plural = 'Alertas de Pago'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Alerta {self.get_tipo_alerta_display()} - Venta {self.venta.id}"
    
    @classmethod
    def generar_alertas_automaticas(cls):
        """
        Genera alertas automáticas para cuotas vencidas y próximas a vencer
        """
        from django.utils import timezone
        
        hoy = timezone.now().date()
        fecha_limite_proxima = hoy + timedelta(days=7)  # Alertar 7 días antes
        
        # Alertas para cuotas próximas a vencer
        cuotas_proximas = CuotaVencimiento.objects.filter(
            fecha_vencimiento__lte=fecha_limite_proxima,
            fecha_vencimiento__gte=hoy,
            estado='pendiente'
        )
        
        for cuota in cuotas_proximas:
            # Verificar si ya existe una alerta activa para esta cuota
            alerta_existente = cls.objects.filter(
                cuota=cuota,
                tipo_alerta='proximo_vencer',
                estado='activa'
            ).exists()
            
            if not alerta_existente:
                dias_restantes = (cuota.fecha_vencimiento - hoy).days
                mensaje = f"La cuota #{cuota.numero_cuota} de la venta #{cuota.venta.id} vence en {dias_restantes} día(s). Cliente: {cuota.venta.cliente_info.nombre} {cuota.venta.cliente_info.apellido}. Monto: ${cuota.monto_cuota:,.0f}"
                
                cls.objects.create(
                    venta=cuota.venta,
                    cuota=cuota,
                    tipo_alerta='proximo_vencer',
                    mensaje=mensaje
                )
        
        # Alertas para cuotas vencidas
        cuotas_vencidas = CuotaVencimiento.objects.filter(
            fecha_vencimiento__lt=hoy,
            estado__in=['pendiente', 'parcial']
        )
        
        for cuota in cuotas_vencidas:
            # Actualizar estado de la cuota
            cuota.actualizar_estado_por_pagos()
            
            # Verificar si ya existe una alerta activa para esta cuota vencida
            alerta_existente = cls.objects.filter(
                cuota=cuota,
                tipo_alerta='vencida',
                estado='activa'
            ).exists()
            
            if not alerta_existente:
                dias_vencida = (hoy - cuota.fecha_vencimiento).days
                mensaje = f"La cuota #{cuota.numero_cuota} de la venta #{cuota.venta.id} está vencida desde hace {dias_vencida} día(s). Cliente: {cuota.venta.cliente_info.nombre} {cuota.venta.cliente_info.apellido}. Monto pendiente: ${cuota.saldo_pendiente:,.0f}"
                
                cls.objects.create(
                    venta=cuota.venta,
                    cuota=cuota,
                    tipo_alerta='vencida',
                    mensaje=mensaje
                )
        
        # Alertas para ventas con múltiples cuotas vencidas
        ventas_multiple_vencidas = CuotaVencimiento.objects.filter(
            estado='vencida'
        ).values('venta').annotate(
            total_vencidas=models.Count('id')
        ).filter(total_vencidas__gte=2)
        
        for venta_data in ventas_multiple_vencidas:
            venta = Venta.objects.get(id=venta_data['venta'])
            total_vencidas = venta_data['total_vencidas']
            
            # Verificar si ya existe una alerta activa para múltiples vencidas
            alerta_existente = cls.objects.filter(
                venta=venta,
                tipo_alerta='multiple_vencidas',
                estado='activa'
            ).exists()
            
            if not alerta_existente:
                mensaje = f"La venta #{venta.id} tiene {total_vencidas} cuotas vencidas. Cliente: {venta.cliente_info.nombre} {venta.cliente_info.apellido}. Saldo total pendiente: ${venta.saldo_pendiente:,.0f}"
                
                cls.objects.create(
                    venta=venta,
                    tipo_alerta='multiple_vencidas',
                    mensaje=mensaje
                )
    
    def marcar_como_leida(self, usuario=None):
        """Marca la alerta como leída"""
        from django.utils import timezone
        
        self.estado = 'leida'
        self.fecha_lectura = timezone.now()
        if usuario:
            self.usuario_asignado = usuario
        self.save()
    
    def marcar_como_resuelta(self):
        """Marca la alerta como resuelta"""
        self.estado = 'resuelta'
        self.save()

class Reporte(models.Model):
    TIPO_REPORTE_CHOICES = [
        ('ventas', 'Ventas'),
        ('pagos', 'Pagos'),
        ('stock', 'Stock'),
        ('clientes', 'Clientes'),
        ('rentabilidad', 'Rentabilidad'),
    ]
    
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reportes_generados')
    tipo_reporte = models.CharField(max_length=20, choices=TIPO_REPORTE_CHOICES)
    parametros = models.JSONField(default=dict, blank=True)
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    archivo = models.FileField(upload_to='reportes/', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Reporte'
        verbose_name_plural = 'Reportes'
        ordering = ['-fecha_generacion']
    
    def __str__(self):
        return f"Reporte {self.get_tipo_reporte_display()} - {self.fecha_generacion.strftime('%d/%m/%Y')}"

class Auditoria(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='acciones_auditoria')
    accion = models.CharField(max_length=100)
    tabla_afectada = models.CharField(max_length=50)
    id_registro = models.IntegerField()
    fecha_accion = models.DateTimeField(auto_now_add=True)
    detalles = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = 'Auditoría'
        verbose_name_plural = 'Auditorías'
        ordering = ['-fecha_accion']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.accion} en {self.tabla_afectada}"