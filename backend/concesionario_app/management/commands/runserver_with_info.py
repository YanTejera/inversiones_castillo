"""
Comando personalizado para ejecutar el servidor mostrando información útil
"""

from django.core.management.base import BaseCommand
from django.core.management.commands.runserver import Command as RunServerCommand
from concesionario_app.production_info import print_startup_info


class Command(RunServerCommand):
    """
    Extiende el comando runserver para mostrar información de producción
    """
    
    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            '--no-info',
            action='store_true',
            help='No mostrar la información de producción al iniciar'
        )
    
    def handle(self, *args, **options):
        # Mostrar información antes de iniciar el servidor
        if not options.get('no_info', False):
            print_startup_info()
        
        # Ejecutar el comando runserver normal
        super().handle(*args, **options)