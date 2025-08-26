from django.core.management.base import BaseCommand
from django.utils import timezone
from notificaciones.signals import generar_alertas_programadas


class Command(BaseCommand):
    help = 'Genera alertas programadas para cuotas vencidas, próximas a vencer y stock bajo'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Mostrar información detallada del proceso',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simular el proceso sin crear notificaciones reales',
        )
    
    def handle(self, *args, **options):
        verbosity = options['verbosity']
        verbose = options.get('verbose', False)
        dry_run = options.get('dry_run', False)
        
        if verbose or verbosity > 1:
            self.stdout.write(
                self.style.SUCCESS(f'Iniciando generación de alertas programadas: {timezone.now()}')
            )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('MODO DRY RUN - No se crearán notificaciones reales')
            )
        
        try:
            if not dry_run:
                generar_alertas_programadas()
            else:
                # En modo dry-run, solo mostrar lo que se haría
                self.simular_generacion_alertas(verbose)
            
            if verbose or verbosity > 1:
                self.stdout.write(
                    self.style.SUCCESS('Alertas programadas generadas exitosamente')
                )
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error generando alertas programadas: {e}')
            )
            raise
    
    def simular_generacion_alertas(self, verbose=False):
        """Simula la generación de alertas sin crear registros reales"""
        from pagos.models import CuotaVencimiento
        from motos.models import Moto
        from notificaciones.models import Notificacion
        from datetime import timedelta, date
        from django.db import models
        
        hoy = timezone.now().date()
        proximos_7_dias = hoy + timedelta(days=7)
        
        # Simular verificación de cuotas vencidas
        cuotas_vencidas = CuotaVencimiento.objects.filter(
            estado__in=['pendiente', 'parcial'],
            fecha_vencimiento__lt=hoy
        ).count()
        
        if verbose:
            self.stdout.write(f'Cuotas vencidas encontradas: {cuotas_vencidas}')
        
        # Simular verificación de cuotas próximas a vencer
        cuotas_proximas = CuotaVencimiento.objects.filter(
            estado='pendiente',
            fecha_vencimiento__range=[hoy + timedelta(days=1), proximos_7_dias]
        ).count()
        
        if verbose:
            self.stdout.write(f'Cuotas próximas a vencer (próximos 7 días): {cuotas_proximas}')
        
        # Simular verificación de stock bajo
        STOCK_MINIMO = 2
        motos_stock_bajo = Moto.objects.filter(
            activa=True,
            cantidad_stock__lte=STOCK_MINIMO
        ).values('marca', 'modelo').annotate(
            total_stock=models.Sum('cantidad_stock')
        ).filter(total_stock__lte=STOCK_MINIMO).count()
        
        if verbose:
            self.stdout.write(f'Modelos con stock bajo encontrados: {motos_stock_bajo}')
        
        total_alertas_potenciales = cuotas_vencidas + cuotas_proximas + motos_stock_bajo
        self.stdout.write(f'Total de alertas potenciales: {total_alertas_potenciales}')