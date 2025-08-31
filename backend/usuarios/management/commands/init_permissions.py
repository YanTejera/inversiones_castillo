from django.core.management.base import BaseCommand
from django.db import transaction
from usuarios.models import PermisoGranular, Rol, RolPermiso

class Command(BaseCommand):
    help = 'Inicializa los permisos granulares del sistema'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando creación de permisos granulares...')
        
        with transaction.atomic():
            # Definir permisos granulares
            permisos_definidos = [
                # === MOTOCICLETAS E INVENTARIO ===
                {
                    'codigo': 'motos.view_motocicletas',
                    'nombre': 'Ver lista de motocicletas',
                    'descripcion': 'Permite ver el catálogo de motocicletas disponibles',
                    'categoria': 'motos',
                    'es_critico': False,
                },
                {
                    'codigo': 'motos.add_motocicleta',
                    'nombre': 'Agregar motocicletas',
                    'descripcion': 'Permite agregar nuevos modelos de motocicletas',
                    'categoria': 'motos',
                    'es_critico': False,
                },
                {
                    'codigo': 'motos.change_motocicleta',
                    'nombre': 'Modificar motocicletas',
                    'descripcion': 'Permite editar información de motocicletas existentes',
                    'categoria': 'motos',
                    'es_critico': False,
                },
                {
                    'codigo': 'motos.delete_motocicleta',
                    'nombre': 'Eliminar motocicletas',
                    'descripcion': 'Permite eliminar modelos de motocicletas',
                    'categoria': 'motos',
                    'es_critico': True,
                },
                {
                    'codigo': 'motos.view_precio_compra',
                    'nombre': 'Ver precios de compra',
                    'descripcion': 'Permite ver los precios de compra de las motocicletas',
                    'categoria': 'motos',
                    'es_critico': True,
                },
                {
                    'codigo': 'motos.change_precio_compra',
                    'nombre': 'Modificar precios de compra',
                    'descripcion': 'Permite modificar los precios de compra',
                    'categoria': 'motos',
                    'es_critico': True,
                },
                {
                    'codigo': 'motos.view_precio_venta',
                    'nombre': 'Ver precios de venta',
                    'descripcion': 'Permite ver los precios de venta al público',
                    'categoria': 'motos',
                    'es_critico': False,
                },
                {
                    'codigo': 'motos.change_precio_venta',
                    'nombre': 'Modificar precios de venta',
                    'descripcion': 'Permite modificar los precios de venta',
                    'categoria': 'motos',
                    'es_critico': True,
                },
                {
                    'codigo': 'motos.view_ganancia',
                    'nombre': 'Ver ganancias',
                    'descripcion': 'Permite ver las ganancias y márgenes de las motocicletas',
                    'categoria': 'motos',
                    'es_critico': True,
                },
                {
                    'codigo': 'motos.manage_inventory',
                    'nombre': 'Gestionar inventario',
                    'descripcion': 'Permite gestionar stock, ubicaciones y movimientos',
                    'categoria': 'motos',
                    'es_critico': False,
                },
                {
                    'codigo': 'motos.view_stock_minimo',
                    'nombre': 'Ver configuraciones de stock',
                    'descripcion': 'Permite ver alertas y configuraciones de stock mínimo',
                    'categoria': 'motos',
                    'es_critico': False,
                },
                {
                    'codigo': 'motos.export_data',
                    'nombre': 'Exportar datos',
                    'descripcion': 'Permite exportar información de motocicletas e inventario',
                    'categoria': 'motos',
                    'es_critico': False,
                },
                {
                    'codigo': 'motos.import_data',
                    'nombre': 'Importar datos',
                    'descripcion': 'Permite importar información masiva de motocicletas',
                    'categoria': 'motos',
                    'es_critico': True,
                },

                # === PROVEEDORES Y COMPRAS ===
                {
                    'codigo': 'proveedores.view_proveedores',
                    'nombre': 'Ver proveedores',
                    'descripcion': 'Permite ver la lista de proveedores',
                    'categoria': 'proveedores',
                    'es_critico': False,
                },
                {
                    'codigo': 'proveedores.add_proveedor',
                    'nombre': 'Agregar proveedores',
                    'descripcion': 'Permite registrar nuevos proveedores',
                    'categoria': 'proveedores',
                    'es_critico': False,
                },
                {
                    'codigo': 'proveedores.change_proveedor',
                    'nombre': 'Modificar proveedores',
                    'descripcion': 'Permite editar información de proveedores',
                    'categoria': 'proveedores',
                    'es_critico': False,
                },
                {
                    'codigo': 'proveedores.view_contabilidad',
                    'nombre': 'Ver contabilidad de proveedores',
                    'descripcion': 'Permite ver facturas, pagos y estado financiero',
                    'categoria': 'proveedores',
                    'es_critico': True,
                },
                {
                    'codigo': 'proveedores.manage_contabilidad',
                    'nombre': 'Gestionar contabilidad',
                    'descripcion': 'Permite crear y modificar facturas y pagos',
                    'categoria': 'proveedores',
                    'es_critico': True,
                },
                {
                    'codigo': 'proveedores.create_orden_compra',
                    'nombre': 'Crear órdenes de compra',
                    'descripcion': 'Permite crear órdenes de compra a proveedores',
                    'categoria': 'proveedores',
                    'es_critico': False,
                },
                {
                    'codigo': 'proveedores.approve_orden_compra',
                    'nombre': 'Aprobar órdenes de compra',
                    'descripcion': 'Permite aprobar y confirmar órdenes de compra',
                    'categoria': 'proveedores',
                    'es_critico': True,
                },
                {
                    'codigo': 'proveedores.view_estadisticas',
                    'nombre': 'Ver estadísticas financieras',
                    'descripcion': 'Permite ver estadísticas y reportes de proveedores',
                    'categoria': 'proveedores',
                    'es_critico': True,
                },
                {
                    'codigo': 'proveedores.manage_credito',
                    'nombre': 'Gestionar límites de crédito',
                    'descripcion': 'Permite modificar límites de crédito de proveedores',
                    'categoria': 'proveedores',
                    'es_critico': True,
                },

                # === CLIENTES Y VENTAS ===
                {
                    'codigo': 'clientes.view_clientes',
                    'nombre': 'Ver clientes',
                    'descripcion': 'Permite ver la lista de clientes',
                    'categoria': 'clientes',
                    'es_critico': False,
                },
                {
                    'codigo': 'clientes.add_cliente',
                    'nombre': 'Agregar clientes',
                    'descripcion': 'Permite registrar nuevos clientes',
                    'categoria': 'clientes',
                    'es_critico': False,
                },
                {
                    'codigo': 'clientes.change_cliente',
                    'nombre': 'Modificar clientes',
                    'descripcion': 'Permite editar información de clientes',
                    'categoria': 'clientes',
                    'es_critico': False,
                },
                {
                    'codigo': 'clientes.delete_cliente',
                    'nombre': 'Eliminar clientes',
                    'descripcion': 'Permite eliminar registros de clientes',
                    'categoria': 'clientes',
                    'es_critico': True,
                },
                {
                    'codigo': 'clientes.view_documentos',
                    'nombre': 'Ver documentos de clientes',
                    'descripcion': 'Permite acceder a documentos personales',
                    'categoria': 'clientes',
                    'es_critico': True,
                },
                {
                    'codigo': 'ventas.create_venta',
                    'nombre': 'Crear ventas',
                    'descripcion': 'Permite crear nuevas transacciones de venta',
                    'categoria': 'clientes',
                    'es_critico': False,
                },
                {
                    'codigo': 'ventas.view_todas_ventas',
                    'nombre': 'Ver todas las ventas',
                    'descripcion': 'Permite ver el historial completo de ventas',
                    'categoria': 'clientes',
                    'es_critico': False,
                },
                {
                    'codigo': 'ventas.cancel_venta',
                    'nombre': 'Cancelar ventas',
                    'descripcion': 'Permite cancelar transacciones de venta',
                    'categoria': 'clientes',
                    'es_critico': True,
                },

                # === FINANZAS Y CONTABILIDAD ===
                {
                    'codigo': 'finanzas.view_reportes',
                    'nombre': 'Ver reportes financieros',
                    'descripcion': 'Permite acceder a reportes financieros generales',
                    'categoria': 'finanzas',
                    'es_critico': True,
                },
                {
                    'codigo': 'finanzas.view_detalle_ganancia',
                    'nombre': 'Ver detalle de ganancias',
                    'descripcion': 'Permite ver ganancias detalladas por producto/período',
                    'categoria': 'finanzas',
                    'es_critico': True,
                },
                {
                    'codigo': 'finanzas.manage_pagos',
                    'nombre': 'Gestionar pagos',
                    'descripcion': 'Permite crear y gestionar pagos de clientes',
                    'categoria': 'finanzas',
                    'es_critico': False,
                },
                {
                    'codigo': 'finanzas.view_cuentas_cobrar',
                    'nombre': 'Ver cuentas por cobrar',
                    'descripcion': 'Permite ver estado de pagos pendientes',
                    'categoria': 'finanzas',
                    'es_critico': False,
                },
                {
                    'codigo': 'finanzas.export_financiero',
                    'nombre': 'Exportar datos financieros',
                    'descripcion': 'Permite exportar reportes financieros',
                    'categoria': 'finanzas',
                    'es_critico': True,
                },

                # === REPORTES Y ANALYTICS ===
                {
                    'codigo': 'reportes.view_dashboard',
                    'nombre': 'Ver dashboard principal',
                    'descripcion': 'Permite acceder al dashboard con métricas generales',
                    'categoria': 'reportes',
                    'es_critico': False,
                },
                {
                    'codigo': 'reportes.view_analytics',
                    'nombre': 'Ver analytics avanzados',
                    'descripcion': 'Permite acceder a análisis y métricas avanzadas',
                    'categoria': 'reportes',
                    'es_critico': False,
                },
                {
                    'codigo': 'reportes.export_reportes',
                    'nombre': 'Exportar reportes',
                    'descripcion': 'Permite exportar reportes en diferentes formatos',
                    'categoria': 'reportes',
                    'es_critico': False,
                },

                # === USUARIOS Y SISTEMA ===
                {
                    'codigo': 'usuarios.view_usuarios',
                    'nombre': 'Ver usuarios',
                    'descripcion': 'Permite ver la lista de usuarios del sistema',
                    'categoria': 'usuarios',
                    'es_critico': False,
                },
                {
                    'codigo': 'usuarios.add_usuario',
                    'nombre': 'Crear usuarios',
                    'descripcion': 'Permite crear nuevos usuarios',
                    'categoria': 'usuarios',
                    'es_critico': True,
                },
                {
                    'codigo': 'usuarios.change_usuario',
                    'nombre': 'Modificar usuarios',
                    'descripcion': 'Permite editar información de usuarios',
                    'categoria': 'usuarios',
                    'es_critico': True,
                },
                {
                    'codigo': 'usuarios.delete_usuario',
                    'nombre': 'Eliminar usuarios',
                    'descripcion': 'Permite eliminar usuarios del sistema',
                    'categoria': 'usuarios',
                    'es_critico': True,
                },
                {
                    'codigo': 'usuarios.manage_permissions',
                    'nombre': 'Gestionar permisos',
                    'descripcion': 'Permite asignar y modificar permisos de usuarios',
                    'categoria': 'usuarios',
                    'es_critico': True,
                },

                # === CONFIGURACIÓN ===
                {
                    'codigo': 'configuracion.view_sistema',
                    'nombre': 'Ver configuración del sistema',
                    'descripcion': 'Permite acceder a configuraciones generales',
                    'categoria': 'configuracion',
                    'es_critico': False,
                },
                {
                    'codigo': 'configuracion.change_sistema',
                    'nombre': 'Modificar configuración',
                    'descripcion': 'Permite modificar configuraciones del sistema',
                    'categoria': 'configuracion',
                    'es_critico': True,
                },
                {
                    'codigo': 'configuracion.backup_restore',
                    'nombre': 'Backup y restauración',
                    'descripcion': 'Permite crear backups y restaurar datos',
                    'categoria': 'configuracion',
                    'es_critico': True,
                },

                # === INVENTARIO ===
                {
                    'codigo': 'inventario.view_overview',
                    'nombre': 'Ver resumen de inventario',
                    'descripcion': 'Permite ver estadísticas generales del inventario',
                    'categoria': 'inventario',
                    'es_critico': False,
                },
                {
                    'codigo': 'inventario.view_locations',
                    'nombre': 'Ver ubicaciones del almacén',
                    'descripcion': 'Permite ver ubicaciones y zonas del almacén',
                    'categoria': 'inventario',
                    'es_critico': False,
                },
                {
                    'codigo': 'inventario.manage_locations',
                    'nombre': 'Gestionar ubicaciones',
                    'descripcion': 'Permite crear y modificar ubicaciones del almacén',
                    'categoria': 'inventario',
                    'es_critico': False,
                },
                {
                    'codigo': 'inventario.view_movements',
                    'nombre': 'Ver movimientos de stock',
                    'descripcion': 'Permite ver historial de movimientos de inventario',
                    'categoria': 'inventario',
                    'es_critico': False,
                },
                {
                    'codigo': 'inventario.create_movements',
                    'nombre': 'Crear movimientos de inventario',
                    'descripcion': 'Permite crear entradas y salidas de inventario',
                    'categoria': 'inventario',
                    'es_critico': True,
                },
                {
                    'codigo': 'inventario.view_alerts',
                    'nombre': 'Ver alertas de stock',
                    'descripcion': 'Permite ver alertas de stock mínimo y faltantes',
                    'categoria': 'inventario',
                    'es_critico': False,
                },
                {
                    'codigo': 'inventario.manage_stock_levels',
                    'nombre': 'Configurar niveles mínimos',
                    'descripcion': 'Permite configurar niveles mínimos de stock',
                    'categoria': 'inventario',
                    'es_critico': False,
                },

                # === SERVICIOS ===
                {
                    'codigo': 'servicios.view_ordenes',
                    'nombre': 'Ver órdenes de servicio',
                    'descripcion': 'Permite ver órdenes de servicio y mantenimiento',
                    'categoria': 'servicios',
                    'es_critico': False,
                },
                {
                    'codigo': 'servicios.create_ordenes',
                    'nombre': 'Crear órdenes de servicio',
                    'descripcion': 'Permite crear nuevas órdenes de servicio',
                    'categoria': 'servicios',
                    'es_critico': False,
                },
                {
                    'codigo': 'servicios.edit_ordenes',
                    'nombre': 'Editar órdenes de servicio',
                    'descripcion': 'Permite modificar órdenes de servicio existentes',
                    'categoria': 'servicios',
                    'es_critico': False,
                },
                {
                    'codigo': 'servicios.view_calendario',
                    'nombre': 'Ver calendario de servicios',
                    'descripcion': 'Permite ver calendario y citas de servicios',
                    'categoria': 'servicios',
                    'es_critico': False,
                },
                {
                    'codigo': 'servicios.manage_calendario',
                    'nombre': 'Gestionar citas y calendario',
                    'descripcion': 'Permite programar y modificar citas de servicio',
                    'categoria': 'servicios',
                    'es_critico': False,
                },
                {
                    'codigo': 'servicios.view_tecnicos',
                    'nombre': 'Ver información de técnicos',
                    'descripcion': 'Permite ver información del personal técnico',
                    'categoria': 'servicios',
                    'es_critico': False,
                },
                {
                    'codigo': 'servicios.manage_tecnicos',
                    'nombre': 'Gestionar técnicos',
                    'descripcion': 'Permite gestionar personal técnico y especialidades',
                    'categoria': 'servicios',
                    'es_critico': True,
                },
                {
                    'codigo': 'servicios.configure_services',
                    'nombre': 'Configurar tipos de servicios',
                    'descripcion': 'Permite configurar tipos de servicios y tarifas',
                    'categoria': 'servicios',
                    'es_critico': True,
                },

                # === ANALYTICS ===
                {
                    'codigo': 'analytics.view_kpis',
                    'nombre': 'Ver KPIs principales',
                    'descripcion': 'Permite ver indicadores clave de rendimiento',
                    'categoria': 'analytics',
                    'es_critico': False,
                },
                {
                    'codigo': 'analytics.view_sales_analysis',
                    'nombre': 'Ver análisis de ventas',
                    'descripcion': 'Permite ver análisis detallado de ventas',
                    'categoria': 'analytics',
                    'es_critico': False,
                },
                {
                    'codigo': 'analytics.view_customer_behavior',
                    'nombre': 'Ver comportamiento de clientes',
                    'descripcion': 'Permite ver análisis de comportamiento de clientes',
                    'categoria': 'analytics',
                    'es_critico': False,
                },
                {
                    'codigo': 'analytics.view_product_performance',
                    'nombre': 'Ver performance de productos',
                    'descripcion': 'Permite ver rendimiento detallado de productos',
                    'categoria': 'analytics',
                    'es_critico': False,
                },
                {
                    'codigo': 'analytics.export_reports',
                    'nombre': 'Exportar reportes de analytics',
                    'descripcion': 'Permite exportar reportes y análisis',
                    'categoria': 'analytics',
                    'es_critico': False,
                },
                {
                    'codigo': 'analytics.view_advanced_metrics',
                    'nombre': 'Ver métricas avanzadas',
                    'descripcion': 'Permite acceder a métricas y análisis avanzados',
                    'categoria': 'analytics',
                    'es_critico': True,
                },

                # === FINANZAS AVANZADAS ===
                {
                    'codigo': 'finanzas.view_dashboard',
                    'nombre': 'Ver dashboard financiero',
                    'descripcion': 'Permite ver resumen ejecutivo financiero',
                    'categoria': 'finanzas',
                    'es_critico': False,
                },
                {
                    'codigo': 'finanzas.view_cash_flow',
                    'nombre': 'Ver flujo de caja',
                    'descripcion': 'Permite ver proyecciones de flujo de caja',
                    'categoria': 'finanzas',
                    'es_critico': True,
                },
                {
                    'codigo': 'finanzas.manage_budgets',
                    'nombre': 'Gestionar presupuestos',
                    'descripcion': 'Permite crear y modificar presupuestos',
                    'categoria': 'finanzas',
                    'es_critico': True,
                },
                {
                    'codigo': 'finanzas.view_financial_reports',
                    'nombre': 'Ver reportes financieros avanzados',
                    'descripcion': 'Permite ver estados financieros detallados',
                    'categoria': 'finanzas',
                    'es_critico': True,
                },
                {
                    'codigo': 'finanzas.view_profit_margins',
                    'nombre': 'Ver márgenes de ganancia',
                    'descripcion': 'Permite ver márgenes detallados por producto',
                    'categoria': 'finanzas',
                    'es_critico': True,
                },
                {
                    'codigo': 'finanzas.manage_expenses',
                    'nombre': 'Gestionar gastos y categorías',
                    'descripcion': 'Permite gestionar gastos y sus categorías',
                    'categoria': 'finanzas',
                    'es_critico': False,
                },
                {
                    'codigo': 'finanzas.view_sensitive_data',
                    'nombre': 'Ver datos financieros sensibles',
                    'descripcion': 'Permite acceder a información financiera crítica',
                    'categoria': 'finanzas',
                    'es_critico': True,
                },
            ]

            # Crear permisos
            created_count = 0
            for permiso_data in permisos_definidos:
                permiso, created = PermisoGranular.objects.get_or_create(
                    codigo=permiso_data['codigo'],
                    defaults=permiso_data
                )
                if created:
                    created_count += 1
                    self.stdout.write(f'OK Creado: {permiso.codigo}')

            self.stdout.write(
                self.style.SUCCESS(f'Se crearon {created_count} nuevos permisos de {len(permisos_definidos)} definidos')
            )

            # Configurar permisos por rol
            self.configurar_permisos_por_rol()

    def configurar_permisos_por_rol(self):
        """Configura permisos predeterminados por rol"""
        self.stdout.write('Configurando permisos por rol...')
        
        # Definir permisos por rol
        permisos_por_rol = {
            'master': [
                # Master tiene TODOS los permisos
                'motos.view_motocicletas',
                'motos.add_motocicleta',
                'motos.change_motocicleta',
                'motos.delete_motocicleta',
                'motos.view_precio_compra',
                'motos.change_precio_compra',
                'motos.view_precio_venta',
                'motos.change_precio_venta',
                'motos.view_ganancia',
                'motos.manage_inventory',
                'motos.view_stock_minimo',
                'motos.export_data',
                'motos.import_data',
                'proveedores.view_proveedores',
                'proveedores.add_proveedor',
                'proveedores.change_proveedor',
                'proveedores.view_contabilidad',
                'proveedores.manage_contabilidad',
                'proveedores.create_orden_compra',
                'proveedores.approve_orden_compra',
                'proveedores.view_estadisticas',
                'proveedores.manage_credito',
                'clientes.view_clientes',
                'clientes.add_cliente',
                'clientes.change_cliente',
                'clientes.delete_cliente',
                'clientes.view_documentos',
                'ventas.create_venta',
                'ventas.view_todas_ventas',
                'ventas.cancel_venta',
                'finanzas.view_reportes',
                'finanzas.view_detalle_ganancia',
                'finanzas.manage_pagos',
                'finanzas.view_cuentas_cobrar',
                'finanzas.export_financiero',
                'reportes.view_dashboard',
                'reportes.view_analytics',
                'reportes.export_reportes',
                'usuarios.view_usuarios',
                'usuarios.add_usuario',
                'usuarios.change_usuario',
                'usuarios.delete_usuario',
                'usuarios.manage_permissions',
                'configuracion.view_sistema',
                'configuracion.change_sistema',
                'configuracion.backup_restore',
                # Nuevos permisos para las secciones agregadas
                'inventario.view_overview',
                'inventario.view_locations',
                'inventario.manage_locations',
                'inventario.view_movements',
                'inventario.create_movements',
                'inventario.view_alerts',
                'inventario.manage_stock_levels',
                'servicios.view_ordenes',
                'servicios.create_ordenes',
                'servicios.edit_ordenes',
                'servicios.view_calendario',
                'servicios.manage_calendario',
                'servicios.view_tecnicos',
                'servicios.manage_tecnicos',
                'servicios.configure_services',
                'analytics.view_kpis',
                'analytics.view_sales_analysis',
                'analytics.view_customer_behavior',
                'analytics.view_product_performance',
                'analytics.export_reports',
                'analytics.view_advanced_metrics',
                'finanzas.view_dashboard',
                'finanzas.view_cash_flow',
                'finanzas.manage_budgets',
                'finanzas.view_financial_reports',
                'finanzas.view_profit_margins',
                'finanzas.manage_expenses',
                'finanzas.view_sensitive_data',
            ],
            'vendedor': [
                'motos.view_motocicletas',
                'motos.view_precio_venta',
                'motos.manage_inventory',
                'clientes.view_clientes',
                'clientes.add_cliente',
                'clientes.change_cliente',
                'ventas.create_venta',
                'ventas.view_todas_ventas',
                'reportes.view_dashboard',
            ],
            'cobrador': [
                'clientes.view_clientes',
                'clientes.change_cliente',
                'finanzas.manage_pagos',
                'finanzas.view_cuentas_cobrar',
                'reportes.view_dashboard',
            ],
            'admin': [
                # Admin tiene la mayoría de permisos excepto los más críticos
                'motos.view_motocicletas',
                'motos.add_motocicleta',
                'motos.change_motocicleta',
                'motos.view_precio_compra',
                'motos.view_precio_venta',
                'motos.change_precio_venta',
                'motos.view_ganancia',
                'motos.manage_inventory',
                'motos.view_stock_minimo',
                'motos.export_data',
                'proveedores.view_proveedores',
                'proveedores.add_proveedor',
                'proveedores.change_proveedor',
                'proveedores.view_contabilidad',
                'proveedores.create_orden_compra',
                'proveedores.view_estadisticas',
                'clientes.view_clientes',
                'clientes.add_cliente',
                'clientes.change_cliente',
                'clientes.view_documentos',
                'ventas.create_venta',
                'ventas.view_todas_ventas',
                'finanzas.view_reportes',
                'finanzas.manage_pagos',
                'finanzas.view_cuentas_cobrar',
                'reportes.view_dashboard',
                'reportes.view_analytics',
                'reportes.export_reportes',
                'usuarios.view_usuarios',
                'configuracion.view_sistema',
                # Permisos básicos para las nuevas secciones
                'inventario.view_overview',
                'inventario.view_locations',
                'inventario.view_movements',
                'inventario.view_alerts',
                'servicios.view_ordenes',
                'servicios.create_ordenes',
                'servicios.edit_ordenes',
                'servicios.view_calendario',
                'analytics.view_kpis',
                'analytics.view_sales_analysis',
                'analytics.view_customer_behavior',
                'analytics.export_reports',
                'finanzas.view_dashboard',
                'finanzas.view_financial_reports',
                'finanzas.manage_expenses',
            ]
        }

        for rol_nombre, codigos_permisos in permisos_por_rol.items():
            try:
                rol = Rol.objects.get(nombre_rol=rol_nombre)
                asignados = 0
                
                for codigo_permiso in codigos_permisos:
                    try:
                        permiso = PermisoGranular.objects.get(codigo=codigo_permiso)
                        rol_permiso, created = RolPermiso.objects.get_or_create(
                            rol=rol,
                            permiso=permiso,
                            defaults={'activo': True}
                        )
                        if created:
                            asignados += 1
                    except PermisoGranular.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(f'Permiso no encontrado: {codigo_permiso}')
                        )
                
                self.stdout.write(f'OK Rol {rol_nombre}: {asignados} permisos asignados')
            
            except Rol.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Rol no encontrado: {rol_nombre}')
                )

        self.stdout.write(self.style.SUCCESS('Configuración de permisos por rol completada'))