from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from usuarios.models import Rol

User = get_user_model()

class Command(BaseCommand):
    help = 'Crea el usuario master del sistema'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='master', help='Nombre de usuario (default: master)')
        parser.add_argument('--email', type=str, required=True, help='Email del usuario master')
        parser.add_argument('--password', type=str, required=True, help='Contraseña del usuario master')
        parser.add_argument('--first_name', type=str, default='Master', help='Nombre (default: Master)')
        parser.add_argument('--last_name', type=str, default='Admin', help='Apellido (default: Admin)')

    def handle(self, *args, **options):
        # Verificar que existe el rol master
        try:
            rol_master = Rol.objects.get(nombre_rol='master')
        except Rol.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Error: El rol "master" no existe. Ejecuta primero: python manage.py crear_roles_defecto')
            )
            return

        # Verificar si ya existe un usuario master
        if User.objects.filter(rol=rol_master).exists():
            self.stdout.write(
                self.style.WARNING('Ya existe un usuario con rol master. Use --force para crear otro.')
            )
            return

        # Crear el usuario master
        try:
            usuario_master = User.objects.create_user(
                username=options['username'],
                email=options['email'],
                password=options['password'],
                first_name=options['first_name'],
                last_name=options['last_name'],
                rol=rol_master,
                estado=True,
                is_staff=True,
                is_superuser=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Usuario master "{usuario_master.username}" creado exitosamente')
            )
            self.stdout.write(f'Email: {usuario_master.email}')
            self.stdout.write(f'Nombre: {usuario_master.first_name} {usuario_master.last_name}')
            self.stdout.write(f'Rol: {usuario_master.rol.get_nombre_rol_display()}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error al crear usuario master: {str(e)}')
            )