from django.apps import AppConfig


class FinanciamientoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'financiamiento'
    verbose_name = 'Financiamiento y Comisiones'
    
    def ready(self):
        import financiamiento.signals