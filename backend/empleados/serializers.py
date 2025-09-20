from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Departamento, Posicion, Empleado, SolicitudTiempo, 
    RegistroAsistencia, Nomina, DocumentoEmpleado, EvaluacionDesempeno
)


class DepartamentoSerializer(serializers.ModelSerializer):
    empleados_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'descripcion', 'presupuesto_mensual', 'activo', 
                 'fecha_creacion', 'empleados_count']
    
    def get_empleados_count(self, obj):
        return Empleado.objects.filter(posicion__departamento=obj, estado='activo').count()


class PosicionSerializer(serializers.ModelSerializer):
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    empleados_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Posicion
        fields = ['id', 'titulo', 'departamento', 'departamento_nombre', 'descripcion',
                 'salario_minimo', 'salario_maximo', 'activa', 'fecha_creacion', 'empleados_count']
    
    def get_empleados_count(self, obj):
        return obj.empleado_set.filter(estado='activo').count()


class EmpleadoSerializer(serializers.ModelSerializer):
    posicion_titulo = serializers.CharField(source='posicion.titulo', read_only=True)
    departamento_nombre = serializers.CharField(source='posicion.departamento.nombre', read_only=True)
    supervisor_nombre = serializers.SerializerMethodField()
    antiguedad_anos = serializers.ReadOnlyField()
    dias_vacaciones_disponibles = serializers.ReadOnlyField()
    dias_enfermedad_disponibles = serializers.ReadOnlyField()
    
    class Meta:
        model = Empleado
        fields = [
            'id', 'numero_empleado', 'nombres', 'apellidos', 'nombre_completo', 'cedula',
            'fecha_nacimiento', 'telefono', 'telefono_emergencia', 'email', 'direccion',
            'posicion', 'posicion_titulo', 'departamento_nombre', 'fecha_ingreso', 
            'fecha_terminacion', 'salario_base', 'tipo_contrato', 'estado',
            'supervisor', 'supervisor_nombre', 'foto', 'notas',
            'dias_vacaciones_anuales', 'dias_enfermedad_anuales',
            'antiguedad_anos', 'dias_vacaciones_disponibles', 'dias_enfermedad_disponibles',
            'fecha_creacion', 'fecha_actualizacion'
        ]
    
    def get_supervisor_nombre(self, obj):
        return obj.supervisor.nombre_completo if obj.supervisor else None


class EmpleadoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    posicion_titulo = serializers.CharField(source='posicion.titulo', read_only=True)
    departamento_nombre = serializers.CharField(source='posicion.departamento.nombre', read_only=True)
    
    class Meta:
        model = Empleado
        fields = [
            'id', 'numero_empleado', 'nombres', 'apellidos', 'nombre_completo',
            'posicion_titulo', 'departamento_nombre', 'estado', 'salario_base',
            'fecha_ingreso', 'foto'
        ]


class SolicitudTiempoSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    aprobada_por_nombre = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = SolicitudTiempo
        fields = [
            'id', 'empleado', 'empleado_nombre', 'tipo', 'tipo_display',
            'fecha_inicio', 'fecha_fin', 'dias_solicitados', 'motivo',
            'estado', 'estado_display', 'aprobada_por', 'aprobada_por_nombre',
            'fecha_aprobacion', 'comentarios_aprobacion', 'documento_soporte', 'fecha_solicitud'
        ]
    
    def get_aprobada_por_nombre(self, obj):
        if obj.aprobada_por:
            return f"{obj.aprobada_por.first_name} {obj.aprobada_por.last_name}".strip()
        return None


class RegistroAsistenciaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = RegistroAsistencia
        fields = [
            'id', 'empleado', 'empleado_nombre', 'fecha', 'hora',
            'tipo', 'tipo_display', 'notas', 'fecha_registro'
        ]


class NominaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    periodo_display = serializers.CharField(source='get_periodo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Nomina
        fields = [
            'id', 'empleado', 'empleado_nombre', 'periodo', 'periodo_display',
            'fecha_inicio', 'fecha_fin', 'año', 'mes',
            'salario_base', 'horas_extras', 'bonificaciones', 'comisiones', 'otros_ingresos',
            'impuesto_renta', 'seguro_social', 'afp', 'seguro_medico', 'prestamos', 'otras_deducciones',
            'total_ingresos', 'total_deducciones', 'salario_neto',
            'estado', 'estado_display', 'fecha_calculo', 'fecha_aprobacion', 'fecha_pago'
        ]


class DocumentoEmpleadoSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    esta_vencido = serializers.ReadOnlyField()
    vence_pronto = serializers.ReadOnlyField()
    
    class Meta:
        model = DocumentoEmpleado
        fields = [
            'id', 'empleado', 'empleado_nombre', 'tipo', 'tipo_display',
            'nombre', 'archivo', 'descripcion', 'fecha_vencimiento',
            'esta_vencido', 'vence_pronto', 'fecha_subida'
        ]


class EvaluacionDesempenoSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    evaluador_nombre = serializers.SerializerMethodField()
    periodo_display = serializers.CharField(source='get_periodo_display', read_only=True)
    puntuacion_promedio = serializers.ReadOnlyField()
    calificacion_text = serializers.ReadOnlyField()
    
    class Meta:
        model = EvaluacionDesempeno
        fields = [
            'id', 'empleado', 'empleado_nombre', 'evaluador', 'evaluador_nombre',
            'periodo', 'periodo_display', 'fecha_evaluacion', 'fecha_inicio_periodo', 'fecha_fin_periodo',
            'calidad_trabajo', 'puntualidad', 'comunicacion', 'trabajo_equipo', 'iniciativa',
            'puntuacion_promedio', 'calificacion_text',
            'fortalezas', 'areas_mejora', 'objetivos_siguientes', 'comentarios_empleado'
        ]
    
    def get_evaluador_nombre(self, obj):
        return f"{obj.evaluador.first_name} {obj.evaluador.last_name}".strip()


# Serializers específicos para reportes y estadísticas
class EmpleadoStatsSerializer(serializers.Serializer):
    total_empleados = serializers.IntegerField()
    empleados_activos = serializers.IntegerField()
    empleados_inactivos = serializers.IntegerField()
    empleados_nuevos_mes = serializers.IntegerField()
    promedio_antiguedad = serializers.FloatField()
    total_departamentos = serializers.IntegerField()
    gasto_nomina_mes = serializers.DecimalField(max_digits=15, decimal_places=2)


class DepartamentoStatsSerializer(serializers.Serializer):
    departamento = serializers.CharField()
    total_empleados = serializers.IntegerField()
    promedio_salario = serializers.DecimalField(max_digits=10, decimal_places=2)
    gasto_total = serializers.DecimalField(max_digits=15, decimal_places=2)


class AsistenciaReporteSerializer(serializers.Serializer):
    empleado_id = serializers.IntegerField()
    empleado_nombre = serializers.CharField()
    dias_trabajados = serializers.IntegerField()
    dias_faltantes = serializers.IntegerField()
    horas_totales = serializers.FloatField()
    porcentaje_asistencia = serializers.FloatField()


class RegistroAsistenciaCreateSerializer(serializers.ModelSerializer):
    """Serializer específico para crear registros de asistencia"""

    class Meta:
        model = RegistroAsistencia
        fields = ['empleado', 'fecha', 'hora', 'tipo', 'notas']

    def validate(self, data):
        # Validar que no se registre el mismo tipo dos veces en el mismo día
        if RegistroAsistencia.objects.filter(
            empleado=data['empleado'],
            fecha=data['fecha'],
            tipo=data['tipo']
        ).exists():
            tipo_display = dict(RegistroAsistencia.TIPO_CHOICES)[data['tipo']]
            raise serializers.ValidationError(
                f'Ya existe un registro de {tipo_display} para este empleado en esta fecha'
            )
        return data


class ResumenAsistenciaDiariaSerializer(serializers.Serializer):
    """Serializer para resumen diario de asistencia"""
    fecha = serializers.DateField()
    empleado_id = serializers.IntegerField()
    empleado_nombre = serializers.CharField()
    empleado_numero = serializers.CharField()
    entrada = serializers.TimeField(allow_null=True)
    salida = serializers.TimeField(allow_null=True)
    entrada_almuerzo = serializers.TimeField(allow_null=True)
    salida_almuerzo = serializers.TimeField(allow_null=True)
    horas_trabajadas = serializers.FloatField(allow_null=True)
    estado = serializers.CharField()  # presente, tarde, ausente, parcial


class AsistenciaStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de asistencia"""
    total_empleados = serializers.IntegerField()
    empleados_presentes = serializers.IntegerField()
    empleados_ausentes = serializers.IntegerField()
    empleados_tardios = serializers.IntegerField()
    porcentaje_asistencia = serializers.FloatField()
    hora_promedio_entrada = serializers.TimeField(allow_null=True)


class RegistroMasivoAsistenciaSerializer(serializers.Serializer):
    """Serializer para registros masivos de asistencia"""
    registros = serializers.ListField(
        child=RegistroAsistenciaCreateSerializer(),
        min_length=1
    )

    def create(self, validated_data):
        registros_data = validated_data['registros']
        registros_creados = []

        for registro_data in registros_data:
            registro = RegistroAsistencia.objects.create(
                **registro_data,
                registrado_por=self.context['request'].user
            )
            registros_creados.append(registro)

        return {'registros_creados': registros_creados}