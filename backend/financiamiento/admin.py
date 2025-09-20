from django.contrib import admin
from django.utils.html import format_html
from .models import (
    EntidadFinanciera, TipoCredito, SolicitudCredito, DocumentoCredito, 
    HistorialCredito, EsquemaComision, TramosComision, AsignacionComision,
    ComisionCalculada, MetaVendedor
)


@admin.register(EntidadFinanciera)
class EntidadFinancieraAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'tasa_minima', 'tasa_maxima', 'activa', 'fecha_creacion']
    list_filter = ['tipo', 'activa', 'fecha_creacion']
    search_fields = ['nombre', 'contacto_nombre', 'contacto_email']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'tipo', 'logo', 'activa')
        }),
        ('Configuración Financiera', {
            'fields': (
                ('tasa_minima', 'tasa_maxima'),
                ('plazo_minimo', 'plazo_maximo'),
                ('monto_minimo', 'monto_maximo'),
                ('requiere_inicial', 'porcentaje_inicial_minimo')
            )
        }),
        ('Información de Contacto', {
            'fields': ('contacto_nombre', 'contacto_telefono', 'contacto_email')
        }),
        ('Integración API', {
            'fields': ('endpoint_api', 'api_key', 'webhook_url'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        })
    )


class TipoCreditoInline(admin.TabularInline):
    model = TipoCredito
    extra = 0


@admin.register(TipoCredito)
class TipoCreditoAdmin(admin.ModelAdmin):
    list_display = ['entidad', 'nombre', 'tasa_interes', 'plazo_maximo', 'activo']
    list_filter = ['entidad', 'activo']
    search_fields = ['nombre', 'descripcion']


class DocumentoCreditoInline(admin.TabularInline):
    model = DocumentoCredito
    extra = 0
    readonly_fields = ['fecha_subida', 'usuario_subida']


class HistorialCreditoInline(admin.TabularInline):
    model = HistorialCredito
    extra = 0
    readonly_fields = ['fecha', 'usuario']
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(SolicitudCredito)
class SolicitudCreditoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_solicitud', 'cliente', 'entidad_financiera', 
        'monto_solicitado', 'estado', 'fecha_solicitud'
    ]
    list_filter = ['estado', 'entidad_financiera', 'fecha_solicitud']
    search_fields = ['numero_solicitud', 'cliente__nombre_completo', 'cliente__cedula']
    readonly_fields = ['numero_solicitud', 'fecha_solicitud', 'fecha_actualizacion']
    
    inlines = [DocumentoCreditoInline, HistorialCreditoInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'numero_solicitud', 'cliente', 'venta', 'vendedor', 'estado'
            )
        }),
        ('Configuración del Crédito', {
            'fields': (
                'entidad_financiera', 'tipo_credito',
                ('monto_solicitado', 'monto_inicial'),
                'plazo_meses'
            )
        }),
        ('Datos de Aprobación', {
            'fields': (
                ('monto_aprobado', 'tasa_aprobada'),
                ('cuota_mensual', 'plazo_aprobado'),
                'condiciones_aprobacion'
            ),
            'classes': ('collapse',)
        }),
        ('Seguimiento', {
            'fields': (
                ('fecha_envio', 'fecha_respuesta', 'fecha_desembolso'),
                'numero_credito_externo',
                'observaciones', 'motivo_rechazo'
            )
        }),
        ('Metadatos', {
            'fields': (
                'usuario_creacion', 'fecha_solicitud', 'fecha_actualizacion'
            ),
            'classes': ('collapse',)
        })
    )

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(self.readonly_fields)
        if obj and obj.estado not in ['borrador']:
            readonly_fields.extend(['monto_solicitado', 'monto_inicial', 'plazo_meses'])
        return readonly_fields


@admin.register(DocumentoCredito)
class DocumentoCreditoAdmin(admin.ModelAdmin):
    list_display = ['solicitud', 'tipo', 'nombre', 'estado_validacion', 'fecha_subida']
    list_filter = ['tipo', 'estado_validacion', 'obligatorio']
    search_fields = ['solicitud__numero_solicitud', 'nombre']
    readonly_fields = ['fecha_subida', 'usuario_subida']


# ========================
# ADMINISTRACIÓN DE COMISIONES
# ========================

class TramosComisionInline(admin.TabularInline):
    model = TramosComision
    extra = 0


@admin.register(EsquemaComision)
class EsquemaComisionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo_esquema', 'porcentaje_base', 'activo', 'fecha_inicio']
    list_filter = ['tipo_esquema', 'activo', 'incluye_financiamiento']
    search_fields = ['nombre', 'descripcion']
    
    inlines = [TramosComisionInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'tipo_esquema', 'activo')
        }),
        ('Configuración de Comisión', {
            'fields': (
                ('porcentaje_base', 'monto_fijo'),
                ('incluye_financiamiento', 'porcentaje_financiamiento')
            )
        }),
        ('Filtros de Aplicación', {
            'fields': (
                'aplica_modelos',
                ('monto_minimo_venta', 'monto_maximo_venta')
            ),
            'classes': ('collapse',)
        }),
        ('Vigencia', {
            'fields': (('fecha_inicio', 'fecha_fin'),)
        }),
        ('Metadatos', {
            'fields': ('fecha_creacion', 'creado_por'),
            'classes': ('collapse',)
        })
    )

    filter_horizontal = ['aplica_modelos']


@admin.register(AsignacionComision)
class AsignacionComisionAdmin(admin.ModelAdmin):
    list_display = ['vendedor', 'esquema', 'fecha_inicio', 'fecha_fin', 'activa']
    list_filter = ['activa', 'esquema', 'fecha_inicio']
    search_fields = ['vendedor__first_name', 'vendedor__last_name', 'esquema__nombre']
    
    fieldsets = (
        ('Asignación', {
            'fields': ('vendedor', 'esquema', 'activa')
        }),
        ('Vigencia', {
            'fields': (('fecha_inicio', 'fecha_fin'),)
        }),
        ('Personalización', {
            'fields': ('porcentaje_personalizado',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('fecha_creacion', 'creado_por'),
            'classes': ('collapse',)
        })
    )


@admin.register(ComisionCalculada)
class ComisionCalculadaAdmin(admin.ModelAdmin):
    list_display = [
        'venta', 'vendedor', 'comision_total', 'estado', 
        'fecha_calculo', 'fecha_pago'
    ]
    list_filter = ['estado', 'fecha_calculo', 'esquema_aplicado']
    search_fields = [
        'venta__numero_venta', 'vendedor__first_name', 
        'vendedor__last_name'
    ]
    readonly_fields = [
        'fecha_calculo', 'monto_venta', 'monto_utilidad', 
        'porcentaje_aplicado', 'comision_venta', 'comision_financiamiento'
    ]
    
    fieldsets = (
        ('Información de Venta', {
            'fields': (
                'venta', 'vendedor', 'esquema_aplicado',
                ('monto_venta', 'monto_utilidad'),
                'porcentaje_aplicado'
            )
        }),
        ('Cálculo de Comisión', {
            'fields': (
                ('comision_venta', 'comision_financiamiento'),
                'comision_total'
            )
        }),
        ('Estado y Seguimiento', {
            'fields': (
                'estado', 'observaciones',
                ('fecha_calculo', 'fecha_aprobacion', 'fecha_pago'),
                'numero_pago'
            )
        }),
        ('Aprobaciones', {
            'fields': ('aprobada_por', 'pagada_por'),
            'classes': ('collapse',)
        })
    )

    actions = ['aprobar_comisiones', 'marcar_como_pagadas']

    def aprobar_comisiones(self, request, queryset):
        count = queryset.filter(estado='calculada').update(
            estado='aprobada',
            fecha_aprobacion=timezone.now(),
            aprobada_por=request.user
        )
        self.message_user(request, f'{count} comisiones aprobadas.')
    aprobar_comisiones.short_description = "Aprobar comisiones seleccionadas"

    def marcar_como_pagadas(self, request, queryset):
        count = queryset.filter(estado='aprobada').update(
            estado='pagada',
            fecha_pago=timezone.now(),
            pagada_por=request.user
        )
        self.message_user(request, f'{count} comisiones marcadas como pagadas.')
    marcar_como_pagadas.short_description = "Marcar como pagadas"


@admin.register(MetaVendedor)
class MetaVendedorAdmin(admin.ModelAdmin):
    list_display = ['vendedor', 'periodo', 'ano', 'mes', 'meta_unidades', 'meta_monto']
    list_filter = ['periodo', 'ano', 'mes']
    search_fields = ['vendedor__first_name', 'vendedor__last_name']
    
    fieldsets = (
        ('Vendedor y Periodo', {
            'fields': ('vendedor', 'periodo', ('ano', 'mes'))
        }),
        ('Metas', {
            'fields': (('meta_unidades', 'meta_monto'),)
        }),
        ('Bonificaciones', {
            'fields': (
                ('bonificacion_cumplimiento', 'bonificacion_sobrecumplimiento'),
            ),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('fecha_creacion', 'creado_por'),
            'classes': ('collapse',)
        })
    )