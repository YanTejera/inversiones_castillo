from django.core.management.base import BaseCommand
from usuarios.models import Rol

class Command(BaseCommand):
    help = 'Crea los roles por defecto del sistema'

    def handle(self, *args, **options):
        roles_defecto = [
            {
                'nombre_rol': 'master',
                'descripcion': 'Usuario principal con acceso total al sistema',
                'puede_gestionar_usuarios': True,
                'puede_ver_reportes': True,
                'puede_gestionar_motos': True,
                'puede_crear_ventas': True,
                'puede_gestionar_pagos': True,
                'puede_ver_finanzas': True,
                'puede_configurar_sistema': True,
            },
            {
                'nombre_rol': 'admin',
                'descripcion': 'Administrador con permisos avanzados',
                'puede_gestionar_usuarios': True,
                'puede_ver_reportes': True,
                'puede_gestionar_motos': True,
                'puede_crear_ventas': True,
                'puede_gestionar_pagos': True,
                'puede_ver_finanzas': True,
                'puede_configurar_sistema': False,
            },
            {
                'nombre_rol': 'vendedor',
                'descripcion': 'Vendedor con permisos para ventas y clientes',
                'puede_gestionar_usuarios': False,
                'puede_ver_reportes': False,
                'puede_gestionar_motos': False,
                'puede_crear_ventas': True,
                'puede_gestionar_pagos': False,
                'puede_ver_finanzas': False,
                'puede_configurar_sistema': False,
            },
            {
                'nombre_rol': 'cobrador',
                'descripcion': 'Cobrador con permisos para gestionar pagos',
                'puede_gestionar_usuarios': False,
                'puede_ver_reportes': False,
                'puede_gestionar_motos': False,
                'puede_crear_ventas': False,
                'puede_gestionar_pagos': True,
                'puede_ver_finanzas': False,
                'puede_configurar_sistema': False,
            },
        ]

        for rol_data in roles_defecto:
            rol, created = Rol.objects.get_or_create(
                nombre_rol=rol_data['nombre_rol'],
                defaults=rol_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Rol "{rol.get_nombre_rol_display()}" creado exitosamente')
                )
            else:
                # Actualizar permisos si ya existe
                for key, value in rol_data.items():
                    if key != 'nombre_rol':
                        setattr(rol, key, value)
                rol.save()
                self.stdout.write(
                    self.style.WARNING(f'Rol "{rol.get_nombre_rol_display()}" ya existía, permisos actualizados')
                )

        self.stdout.write(
            self.style.SUCCESS('Roles por defecto configurados correctamente')
        )