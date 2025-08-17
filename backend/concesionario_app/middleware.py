"""
Middleware personalizado para mostrar información útil
"""

import os
from django.conf import settings
from concesionario_app.production_info import print_urls_only


class StartupInfoMiddleware:
    """
    Middleware que muestra información útil la primera vez que se recibe una request
    """
    
    _info_shown = False
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Mostrar información solo la primera vez y solo en desarrollo
        if not StartupInfoMiddleware._info_shown and settings.DEBUG:
            print_urls_only()
            StartupInfoMiddleware._info_shown = True
            
        response = self.get_response(request)
        return response