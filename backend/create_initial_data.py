import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'concesionario_app.settings')
django.setup()

from usuarios.models import Rol, Usuario

# Crear roles iniciales
roles_data = [
    {'nombre_rol': 'Administrador', 'descripcion': 'Acceso completo al sistema'},
    {'nombre_rol': 'Vendedor', 'descripcion': 'Puede realizar ventas y gestionar clientes'},
    {'nombre_rol': 'Cobrador', 'descripcion': 'Puede gestionar pagos y cobros'},
    {'nombre_rol': 'Contador', 'descripcion': 'Puede generar reportes y consultar estadísticas'},
]

for rol_data in roles_data:
    rol, created = Rol.objects.get_or_create(
        nombre_rol=rol_data['nombre_rol'],
        defaults={'descripcion': rol_data['descripcion']}
    )
    if created:
        print(f"Rol creado: {rol.nombre_rol}")

# Crear usuario administrador
admin_rol = Rol.objects.get(nombre_rol='Administrador')
admin_user, created = Usuario.objects.get_or_create(
    username='admin',
    defaults={
        'first_name': 'Administrador',
        'last_name': 'Sistema',
        'email': 'admin@concesionario.com',
        'telefono': '3001234567',
        'rol': admin_rol,
        'is_staff': True,
        'is_superuser': True,
    }
)

if created:
    admin_user.set_password('admin123')
    admin_user.save()
    print("Usuario administrador creado: admin/admin123")
else:
    print("Usuario administrador ya existe")

print("Datos iniciales creados exitosamente!")