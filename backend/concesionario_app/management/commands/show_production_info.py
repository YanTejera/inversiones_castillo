"""
Comando para mostrar información de producción
"""

from django.core.management.base import BaseCommand
from concesionario_app.production_info import print_startup_info, print_urls_only


class Command(BaseCommand):
    """
    Comando para mostrar información de producción y enlaces útiles
    """
    help = 'Muestra información de producción, URLs y credenciales'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--compact',
            action='store_true',
            help='Mostrar solo URLs en formato compacto'
        )
    
    def handle(self, *args, **options):
        if options['compact']:
            print_urls_only()
        else:
            print_startup_info()