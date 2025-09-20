from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from datetime import date, timedelta


class Departamento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    presupuesto_mensual = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Presupuesto mensual del departamento"
    )
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Posicion(models.Model):
    titulo = models.CharField(max_length=100)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, related_name='posiciones')
    descripcion = models.TextField(blank=True)
    salario_minimo = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Salario mínimo para esta posición"
    )
    salario_maximo = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Salario máximo para esta posición"
    )
    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Posición'
        verbose_name_plural = 'Posiciones'
        ordering = ['departamento', 'titulo']
        unique_together = ['titulo', 'departamento']
    
    def __str__(self):
        return f"{self.titulo} - {self.departamento.nombre}"


class Empleado(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
        ('vacaciones', 'En Vacaciones'),
        ('licencia', 'En Licencia'),
        ('terminado', 'Terminado'),
    ]
    
    TIPO_CONTRATO_CHOICES = [
        ('indefinido', 'Indefinido'),
        ('temporal', 'Temporal'),
        ('medio_tiempo', 'Medio Tiempo'),
        ('por_horas', 'Por Horas'),
        ('freelance', 'Freelance'),
    ]
    
    # Información personal
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    numero_empleado = models.CharField(max_length=20, unique=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    cedula = models.CharField(max_length=20, unique=True)
    fecha_nacimiento = models.DateField()
    telefono = models.CharField(max_length=20)
    telefono_emergencia = models.CharField(max_length=20, blank=True)
    email = models.EmailField()
    direccion = models.TextField()
    
    # Información laboral
    posicion = models.ForeignKey(Posicion, on_delete=models.PROTECT)
    fecha_ingreso = models.DateField()
    fecha_terminacion = models.DateField(null=True, blank=True)
    salario_base = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Salario base mensual"
    )
    tipo_contrato = models.CharField(max_length=20, choices=TIPO_CONTRATO_CHOICES, default='indefinido')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activo')
    
    # Información adicional
    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    foto = models.ImageField(upload_to='empleados/fotos/', null=True, blank=True)
    notas = models.TextField(blank=True)
    
    # Configuración de días
    dias_vacaciones_anuales = models.IntegerField(
        default=15,
        validators=[MinValueValidator(0), MaxValueValidator(365)]
    )
    dias_enfermedad_anuales = models.IntegerField(
        default=10,
        validators=[MinValueValidator(0), MaxValueValidator(365)]
    )
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='empleados_creados'
    )
    
    class Meta:
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        ordering = ['apellidos', 'nombres']
    
    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.numero_empleado})"
    
    @property
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}"
    
    @property
    def antiguedad_anos(self):
        if self.fecha_terminacion:
            fin = self.fecha_terminacion
        else:
            fin = date.today()
        delta = fin - self.fecha_ingreso
        return delta.days // 365
    
    @property
    def dias_vacaciones_disponibles(self):
        """Calcula días de vacaciones disponibles en el año actual"""
        year = date.today().year
        vacaciones_tomadas = self.solicitudes_tiempo.filter(
            tipo='vacaciones',
            estado='aprobada',
            fecha_inicio__year=year
        ).aggregate(
            total=models.Sum('dias_solicitados')
        )['total'] or 0
        
        return max(0, self.dias_vacaciones_anuales - vacaciones_tomadas)
    
    @property
    def dias_enfermedad_disponibles(self):
        """Calcula días de enfermedad disponibles en el año actual"""
        year = date.today().year
        enfermedad_tomados = self.solicitudes_tiempo.filter(
            tipo='enfermedad',
            estado='aprobada',
            fecha_inicio__year=year
        ).aggregate(
            total=models.Sum('dias_solicitados')
        )['total'] or 0
        
        return max(0, self.dias_enfermedad_anuales - enfermedad_tomados)


class SolicitudTiempo(models.Model):
    TIPO_CHOICES = [
        ('vacaciones', 'Vacaciones'),
        ('enfermedad', 'Enfermedad'),
        ('personal', 'Personal'),
        ('maternidad', 'Maternidad/Paternidad'),
        ('duelo', 'Duelo'),
        ('compensatorio', 'Compensatorio'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
        ('cancelada', 'Cancelada'),
    ]
    
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name='solicitudes_tiempo')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    dias_solicitados = models.IntegerField()
    motivo = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    # Aprobación
    aprobada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='solicitudes_aprobadas'
    )
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    comentarios_aprobacion = models.TextField(blank=True)

    # Documentos de soporte
    documento_soporte = models.FileField(
        upload_to='solicitudes/documentos/',
        null=True,
        blank=True,
        help_text="Documento de soporte (certificado médico, carta, etc.)"
    )

    # Metadatos
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Solicitud de Tiempo'
        verbose_name_plural = 'Solicitudes de Tiempo'
        ordering = ['-fecha_solicitud']
    
    def __str__(self):
        return f"{self.empleado.nombre_completo} - {self.get_tipo_display()} ({self.fecha_inicio} a {self.fecha_fin})"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.fecha_fin < self.fecha_inicio:
            raise ValidationError('La fecha de fin debe ser posterior a la fecha de inicio')
        
        # Calcular días automáticamente
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            self.dias_solicitados = delta.days + 1


class RegistroAsistencia(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('entrada_almuerzo', 'Entrada Almuerzo'),
        ('salida_almuerzo', 'Salida Almuerzo'),
    ]
    
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name='registros_asistencia')
    fecha = models.DateField()
    hora = models.TimeField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    notas = models.TextField(blank=True)
    
    # Metadatos
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        verbose_name = 'Registro de Asistencia'
        verbose_name_plural = 'Registros de Asistencia'
        ordering = ['-fecha', '-hora']
        unique_together = ['empleado', 'fecha', 'tipo']
    
    def __str__(self):
        return f"{self.empleado.nombre_completo} - {self.get_tipo_display()} {self.fecha} {self.hora}"


class Nomina(models.Model):
    PERIODO_CHOICES = [
        ('quincenal', 'Quincenal'),
        ('mensual', 'Mensual'),
        ('semanal', 'Semanal'),
    ]
    
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('calculada', 'Calculada'),
        ('aprobada', 'Aprobada'),
        ('pagada', 'Pagada'),
    ]
    
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name='nominas')
    periodo = models.CharField(max_length=20, choices=PERIODO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    año = models.IntegerField()
    mes = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    
    # Ingresos
    salario_base = models.DecimalField(max_digits=10, decimal_places=2)
    horas_extras = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonificaciones = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    comisiones = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    otros_ingresos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Deducciones
    impuesto_renta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seguro_social = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    afp = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seguro_medico = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prestamos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    otras_deducciones = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Calculados
    total_ingresos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_deducciones = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    salario_neto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Estado y metadatos
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    fecha_calculo = models.DateTimeField(null=True, blank=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    
    calculada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='nominas_calculadas'
    )
    aprobada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='nominas_aprobadas'
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Nómina'
        verbose_name_plural = 'Nóminas'
        ordering = ['-año', '-mes', 'empleado__apellidos']
        unique_together = ['empleado', 'año', 'mes', 'periodo']
    
    def __str__(self):
        return f"{self.empleado.nombre_completo} - {self.mes}/{self.año}"
    
    def calcular_totales(self):
        """Calcula los totales de ingresos, deducciones y salario neto"""
        self.total_ingresos = (
            self.salario_base + 
            self.horas_extras + 
            self.bonificaciones + 
            self.comisiones + 
            self.otros_ingresos
        )
        
        self.total_deducciones = (
            self.impuesto_renta + 
            self.seguro_social + 
            self.afp + 
            self.seguro_medico + 
            self.prestamos + 
            self.otras_deducciones
        )
        
        self.salario_neto = self.total_ingresos - self.total_deducciones
        
    def save(self, *args, **kwargs):
        self.calcular_totales()
        super().save(*args, **kwargs)


class DocumentoEmpleado(models.Model):
    TIPO_CHOICES = [
        ('contrato', 'Contrato'),
        ('cedula', 'Cédula'),
        ('curriculum', 'Curriculum'),
        ('certificado_medico', 'Certificado Médico'),
        ('referencias', 'Referencias'),
        ('evaluacion', 'Evaluación'),
        ('carta_recomendacion', 'Carta de Recomendación'),
        ('otro', 'Otro'),
    ]
    
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name='documentos')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    nombre = models.CharField(max_length=200)
    archivo = models.FileField(upload_to='empleados/documentos/')
    descripcion = models.TextField(blank=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    
    fecha_subida = models.DateTimeField(auto_now_add=True)
    subido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        verbose_name = 'Documento de Empleado'
        verbose_name_plural = 'Documentos de Empleados'
        ordering = ['-fecha_subida']
    
    def __str__(self):
        return f"{self.empleado.nombre_completo} - {self.get_tipo_display()}"
    
    @property
    def esta_vencido(self):
        if self.fecha_vencimiento:
            return date.today() > self.fecha_vencimiento
        return False
    
    @property
    def vence_pronto(self):
        if self.fecha_vencimiento:
            return date.today() + timedelta(days=30) >= self.fecha_vencimiento
        return False


class EvaluacionDesempeno(models.Model):
    PERIODO_CHOICES = [
        ('mensual', 'Mensual'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
    ]
    
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name='evaluaciones')
    evaluador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='evaluaciones_realizadas')
    periodo = models.CharField(max_length=20, choices=PERIODO_CHOICES)
    fecha_evaluacion = models.DateField()
    fecha_inicio_periodo = models.DateField()
    fecha_fin_periodo = models.DateField()
    
    # Puntuaciones (1-5)
    calidad_trabajo = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calidad del trabajo (1-5)"
    )
    puntualidad = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Puntualidad (1-5)"
    )
    comunicacion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Habilidades de comunicación (1-5)"
    )
    trabajo_equipo = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Trabajo en equipo (1-5)"
    )
    iniciativa = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Iniciativa y proactividad (1-5)"
    )
    
    # Comentarios
    fortalezas = models.TextField()
    areas_mejora = models.TextField()
    objetivos_siguientes = models.TextField()
    comentarios_empleado = models.TextField(blank=True)
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Evaluación de Desempeño'
        verbose_name_plural = 'Evaluaciones de Desempeño'
        ordering = ['-fecha_evaluacion']
    
    def __str__(self):
        return f"Evaluación de {self.empleado.nombre_completo} - {self.fecha_evaluacion}"
    
    @property
    def puntuacion_promedio(self):
        return (
            self.calidad_trabajo + 
            self.puntualidad + 
            self.comunicacion + 
            self.trabajo_equipo + 
            self.iniciativa
        ) / 5
    
    @property
    def calificacion_text(self):
        promedio = self.puntuacion_promedio
        if promedio >= 4.5:
            return "Excelente"
        elif promedio >= 3.5:
            return "Bueno"
        elif promedio >= 2.5:
            return "Satisfactorio"
        elif promedio >= 1.5:
            return "Necesita Mejora"
        else:
            return "Insatisfactorio"