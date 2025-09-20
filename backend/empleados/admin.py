from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    Departamento, Posicion, Empleado, SolicitudTiempo, 
    RegistroAsistencia, Nomina, DocumentoEmpleado, EvaluacionDesempeno
)


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'empleados_count', 'presupuesto_mensual', 'activo', 'fecha_creacion']
    list_filter = ['activo', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion']
    readonly_fields = ['fecha_creacion']
    
    def empleados_count(self, obj):
        count = obj.posiciones.filter(empleado__estado='activo').count()
        return count
    empleados_count.short_description = 'Empleados Activos'


@admin.register(Posicion)
class PosicionAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'departamento', 'empleados_count', 'salario_minimo', 'salario_maximo', 'activa']
    list_filter = ['departamento', 'activa', 'fecha_creacion']
    search_fields = ['titulo', 'descripcion', 'departamento__nombre']
    readonly_fields = ['fecha_creacion']
    
    def empleados_count(self, obj):
        return obj.empleado_set.filter(estado='activo').count()
    empleados_count.short_description = 'Empleados'


class SolicitudTiempoInline(admin.TabularInline):
    model = SolicitudTiempo
    extra = 0
    readonly_fields = ['fecha_solicitud']
    fields = ['tipo', 'fecha_inicio', 'fecha_fin', 'dias_solicitados', 'estado', 'fecha_solicitud']


class DocumentoEmpleadoInline(admin.TabularInline):
    model = DocumentoEmpleado
    extra = 0
    readonly_fields = ['fecha_subida', 'esta_vencido', 'vence_pronto']


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_empleado', 'nombre_completo', 'posicion', 'estado', 
        'salario_base', 'fecha_ingreso', 'antiguedad_display'
    ]
    list_filter = [
        'estado', 'tipo_contrato', 'posicion__departamento', 
        'fecha_ingreso', 'posicion'
    ]
    search_fields = [
        'nombres', 'apellidos', 'numero_empleado', 'cedula', 
        'email', 'posicion__titulo'
    ]
    readonly_fields = [
        'nombre_completo', 'antiguedad_anos', 'dias_vacaciones_disponibles',
        'dias_enfermedad_disponibles', 'fecha_creacion', 'fecha_actualizacion'
    ]
    
    fieldsets = (
        ('Información Personal', {
            'fields': (
                ('nombres', 'apellidos'),
                ('numero_empleado', 'cedula'),
                ('fecha_nacimiento', 'email'),
                ('telefono', 'telefono_emergencia'),
                'direccion',
                'foto'
            )
        }),
        ('Información Laboral', {
            'fields': (
                'posicion',
                ('fecha_ingreso', 'fecha_terminacion'),
                ('salario_base', 'tipo_contrato', 'estado'),
                'supervisor',
                'notas'
            )
        }),
        ('Configuración de Tiempo', {
            'fields': (
                ('dias_vacaciones_anuales', 'dias_enfermedad_anuales'),
                ('dias_vacaciones_disponibles', 'dias_enfermedad_disponibles')
            )
        }),
        ('Metadatos', {
            'fields': (
                ('antiguedad_anos', 'creado_por'),
                ('fecha_creacion', 'fecha_actualizacion')
            ),
            'classes': ('collapse',)
        })
    )
    
    inlines = [SolicitudTiempoInline, DocumentoEmpleadoInline]
    
    def antiguedad_display(self, obj):
        return f"{obj.antiguedad_anos} años"
    antiguedad_display.short_description = 'Antigüedad'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo empleado
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(SolicitudTiempo)
class SolicitudTiempoAdmin(admin.ModelAdmin):
    list_display = [
        'empleado', 'tipo', 'fecha_inicio', 'fecha_fin', 
        'dias_solicitados', 'estado', 'fecha_solicitud'
    ]
    list_filter = [
        'tipo', 'estado', 'fecha_solicitud', 'fecha_inicio'
    ]
    search_fields = [
        'empleado__nombres', 'empleado__apellidos', 
        'empleado__numero_empleado', 'motivo'
    ]
    readonly_fields = ['dias_solicitados', 'fecha_solicitud', 'fecha_actualizacion']
    
    fieldsets = (
        ('Información de la Solicitud', {
            'fields': (
                'empleado',
                ('tipo', 'estado'),
                ('fecha_inicio', 'fecha_fin', 'dias_solicitados'),
                'motivo'
            )
        }),
        ('Aprobación', {
            'fields': (
                ('aprobada_por', 'fecha_aprobacion'),
                'comentarios_aprobacion'
            )
        }),
        ('Metadatos', {
            'fields': ('fecha_solicitud', 'fecha_actualizacion'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['aprobar_solicitudes', 'rechazar_solicitudes']
    
    def aprobar_solicitudes(self, request, queryset):
        count = queryset.filter(estado='pendiente').update(
            estado='aprobada',
            aprobada_por=request.user,
            fecha_aprobacion=timezone.now()
        )
        self.message_user(request, f'{count} solicitudes aprobadas.')
    aprobar_solicitudes.short_description = "Aprobar solicitudes seleccionadas"
    
    def rechazar_solicitudes(self, request, queryset):
        count = queryset.filter(estado='pendiente').update(
            estado='rechazada',
            aprobada_por=request.user,
            fecha_aprobacion=timezone.now()
        )
        self.message_user(request, f'{count} solicitudes rechazadas.')
    rechazar_solicitudes.short_description = "Rechazar solicitudes seleccionadas"


@admin.register(RegistroAsistencia)
class RegistroAsistenciaAdmin(admin.ModelAdmin):
    list_display = ['empleado', 'fecha', 'hora', 'tipo', 'fecha_registro']
    list_filter = ['tipo', 'fecha', 'fecha_registro']
    search_fields = ['empleado__nombres', 'empleado__apellidos', 'empleado__numero_empleado']
    readonly_fields = ['fecha_registro']
    date_hierarchy = 'fecha'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.registrado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(Nomina)
class NominaAdmin(admin.ModelAdmin):
    list_display = [
        'empleado', 'año', 'mes', 'periodo', 'salario_neto', 
        'estado', 'fecha_calculo'
    ]
    list_filter = [
        'año', 'mes', 'periodo', 'estado', 'fecha_calculo'
    ]
    search_fields = [
        'empleado__nombres', 'empleado__apellidos', 'empleado__numero_empleado'
    ]
    readonly_fields = [
        'total_ingresos', 'total_deducciones', 'salario_neto',
        'fecha_creacion', 'fecha_actualizacion'
    ]
    
    fieldsets = (
        ('Información General', {
            'fields': (
                'empleado',
                ('periodo', 'año', 'mes'),
                ('fecha_inicio', 'fecha_fin'),
                'estado'
            )
        }),
        ('Ingresos', {
            'fields': (
                'salario_base',
                ('horas_extras', 'bonificaciones'),
                ('comisiones', 'otros_ingresos'),
                'total_ingresos'
            )
        }),
        ('Deducciones', {
            'fields': (
                ('impuesto_renta', 'seguro_social'),
                ('afp', 'seguro_medico'),
                ('prestamos', 'otras_deducciones'),
                'total_deducciones'
            )
        }),
        ('Resumen', {
            'fields': ('salario_neto',)
        }),
        ('Seguimiento', {
            'fields': (
                ('calculada_por', 'fecha_calculo'),
                ('aprobada_por', 'fecha_aprobacion'),
                'fecha_pago'
            ),
            'classes': ('collapse',)
        })
    )
    
    actions = ['calcular_totales', 'aprobar_nominas', 'marcar_pagadas']
    
    def calcular_totales(self, request, queryset):
        count = 0
        for nomina in queryset:
            nomina.calcular_totales()
            if nomina.estado == 'borrador':
                nomina.estado = 'calculada'
                nomina.calculada_por = request.user
                nomina.fecha_calculo = timezone.now()
            nomina.save()
            count += 1
        self.message_user(request, f'{count} nóminas calculadas.')
    calcular_totales.short_description = "Calcular totales"
    
    def aprobar_nominas(self, request, queryset):
        count = queryset.filter(estado__in=['calculada', 'borrador']).update(
            estado='aprobada',
            aprobada_por=request.user,
            fecha_aprobacion=timezone.now()
        )
        self.message_user(request, f'{count} nóminas aprobadas.')
    aprobar_nominas.short_description = "Aprobar nóminas seleccionadas"
    
    def marcar_pagadas(self, request, queryset):
        count = queryset.filter(estado='aprobada').update(
            estado='pagada',
            fecha_pago=timezone.now()
        )
        self.message_user(request, f'{count} nóminas marcadas como pagadas.')
    marcar_pagadas.short_description = "Marcar como pagadas"


@admin.register(DocumentoEmpleado)
class DocumentoEmpleadoAdmin(admin.ModelAdmin):
    list_display = [
        'empleado', 'tipo', 'nombre', 'fecha_vencimiento', 
        'estado_vencimiento', 'fecha_subida'
    ]
    list_filter = ['tipo', 'fecha_vencimiento', 'fecha_subida']
    search_fields = [
        'empleado__nombres', 'empleado__apellidos', 
        'empleado__numero_empleado', 'nombre'
    ]
    readonly_fields = ['fecha_subida', 'esta_vencido', 'vence_pronto']
    
    def estado_vencimiento(self, obj):
        if obj.fecha_vencimiento:
            if obj.esta_vencido:
                return format_html('<span style="color: red;">Vencido</span>')
            elif obj.vence_pronto:
                return format_html('<span style="color: orange;">Por vencer</span>')
            else:
                return format_html('<span style="color: green;">Vigente</span>')
        return 'Sin fecha'
    estado_vencimiento.short_description = 'Estado'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.subido_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(EvaluacionDesempeno)
class EvaluacionDesempenoAdmin(admin.ModelAdmin):
    list_display = [
        'empleado', 'evaluador', 'fecha_evaluacion', 
        'puntuacion_promedio_display', 'calificacion_text'
    ]
    list_filter = [
        'periodo', 'fecha_evaluacion', 'evaluador',
        'calidad_trabajo', 'puntualidad'
    ]
    search_fields = [
        'empleado__nombres', 'empleado__apellidos', 
        'empleado__numero_empleado'
    ]
    readonly_fields = ['puntuacion_promedio', 'calificacion_text', 'fecha_creacion']
    
    fieldsets = (
        ('Información General', {
            'fields': (
                ('empleado', 'evaluador'),
                ('periodo', 'fecha_evaluacion'),
                ('fecha_inicio_periodo', 'fecha_fin_periodo')
            )
        }),
        ('Puntuaciones', {
            'fields': (
                ('calidad_trabajo', 'puntualidad'),
                ('comunicacion', 'trabajo_equipo'),
                'iniciativa',
                ('puntuacion_promedio', 'calificacion_text')
            )
        }),
        ('Comentarios', {
            'fields': (
                'fortalezas',
                'areas_mejora',
                'objetivos_siguientes',
                'comentarios_empleado'
            )
        })
    )
    
    def puntuacion_promedio_display(self, obj):
        return f"{obj.puntuacion_promedio:.1f}"
    puntuacion_promedio_display.short_description = 'Promedio'