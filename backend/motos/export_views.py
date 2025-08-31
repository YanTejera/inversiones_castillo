from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import pandas as pd
import io
from datetime import datetime, timedelta
import json
from decimal import Decimal

from .models import MotoModelo, MotoInventario, Moto, Proveedor
from ventas.models import Venta
from usuarios.models import Cliente
from pagos.models import Pago
from .simple_location_views import Ubicacion, Almacen, Zona

class DecimalEncoder(json.JSONEncoder):
    """JSON encoder para manejar Decimal objects"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

class ExportInventoryView(APIView):
    """Exportar inventario completo"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            format_type = request.GET.get('export_format', 'excel')  # excel, csv, json
            
            # Obtener todos los datos de inventario
            inventario_data = []
            
            # Obtener inventario por modelo
            modelos = MotoModelo.objects.prefetch_related('inventario').all()
            
            for modelo in modelos:
                for inv in modelo.inventario.all():
                    # Obtener ubicación si existe
                    ubicacion_info = "Sin asignar"
                    try:
                        if hasattr(inv, 'ubicacion_actual'):
                            ubicacion = inv.ubicacion_actual.ubicacion
                            ubicacion_info = ubicacion.codigo_completo
                    except:
                        ubicacion_info = "Sin asignar"
                    
                    inventario_data.append({
                        'ID_Modelo': modelo.id,
                        'Marca': modelo.marca,
                        'Modelo': modelo.modelo,
                        'Año': modelo.ano,
                        'Cilindraje': modelo.cilindraje,
                        'Color': inv.color,
                        'Chasis': inv.chasis,
                        'Stock_Disponible': inv.cantidad_stock if hasattr(inv, 'cantidad_stock') else 1,
                        'Precio_Compra': float(inv.precio_compra_individual) if inv.precio_compra_individual else 0,
                        'Precio_Venta': float(modelo.precio_venta),
                        'Descuento_Porcentaje': float(inv.descuento_porcentaje),
                        'Precio_Con_Descuento': float(inv.precio_con_descuento),
                        'Ubicacion_Fisica': ubicacion_info,
                        'Estado': 'Disponible' if modelo.activa else 'Inactiva',
                        'Fecha_Ingreso': inv.fecha_ingreso.strftime('%Y-%m-%d') if inv.fecha_ingreso else '',
                        'Tasa_Dolar': float(inv.tasa_dolar) if inv.tasa_dolar else 0,
                        'Fecha_Compra': inv.fecha_compra.strftime('%Y-%m-%d') if inv.fecha_compra else ''
                    })
            
            if format_type == 'excel':
                return self._export_excel(inventario_data, 'inventario_completo')
            elif format_type == 'csv':
                return self._export_csv(inventario_data, 'inventario_completo')
            else:  # json
                return JsonResponse({
                    'data': inventario_data,
                    'total_records': len(inventario_data),
                    'export_date': timezone.now().isoformat()
                }, encoder=DecimalEncoder)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _export_excel(self, data, filename):
        """Crear archivo Excel"""
        df = pd.DataFrame(data)
        
        # Crear buffer en memoria
        buffer = io.BytesIO()
        
        # Crear archivo Excel
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Inventario', index=False)
            
            # Obtener el workbook y worksheet para formatear
            workbook = writer.book
            worksheet = writer.sheets['Inventario']
            
            # Ajustar ancho de columnas
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        
        # Crear respuesta HTTP
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response
    
    def _export_csv(self, data, filename):
        """Crear archivo CSV"""
        df = pd.DataFrame(data)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        df.to_csv(response, index=False, encoding='utf-8-sig')  # utf-8-sig para Excel
        return response

class ExportSalesView(APIView):
    """Exportar datos de ventas"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            format_type = request.GET.get('export_format', 'excel')
            fecha_desde = request.GET.get('fecha_desde')
            fecha_hasta = request.GET.get('fecha_hasta')
            
            # Filtros de fecha
            ventas_query = Venta.objects.select_related('moto', 'cliente', 'vendedor').all()
            
            if fecha_desde:
                ventas_query = ventas_query.filter(fecha_venta__gte=fecha_desde)
            if fecha_hasta:
                ventas_query = ventas_query.filter(fecha_venta__lte=fecha_hasta)
            
            # Preparar datos
            ventas_data = []
            for venta in ventas_query:
                ventas_data.append({
                    'ID_Venta': venta.id,
                    'Fecha_Venta': venta.fecha_venta.strftime('%Y-%m-%d %H:%M'),
                    'Cliente': venta.cliente.nombre if venta.cliente else 'N/A',
                    'Cliente_Cedula': venta.cliente.cedula if venta.cliente else 'N/A',
                    'Vendedor': f"{venta.vendedor.first_name} {venta.vendedor.last_name}" if venta.vendedor else 'N/A',
                    'Motocicleta': f"{venta.moto.marca} {venta.moto.modelo}" if venta.moto else 'N/A',
                    'Precio_Venta': float(venta.precio_venta),
                    'Descuento': float(venta.descuento) if venta.descuento else 0,
                    'Precio_Final': float(venta.precio_final),
                    'Tipo_Pago': venta.tipo_pago,
                    'Estado_Pago': venta.estado_pago,
                    'Observaciones': venta.observaciones or '',
                    'Comision_Vendedor': float(venta.comision_vendedor) if hasattr(venta, 'comision_vendedor') else 0
                })
            
            if format_type == 'excel':
                return self._export_excel(ventas_data, 'reporte_ventas')
            elif format_type == 'csv':
                return self._export_csv(ventas_data, 'reporte_ventas')
            else:
                return JsonResponse({
                    'data': ventas_data,
                    'total_records': len(ventas_data),
                    'total_value': sum(float(v['Precio_Final']) for v in ventas_data),
                    'export_date': timezone.now().isoformat()
                }, encoder=DecimalEncoder)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _export_excel(self, data, filename):
        """Crear archivo Excel para ventas"""
        df = pd.DataFrame(data)
        
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Ventas', index=False)
            
            workbook = writer.book
            worksheet = writer.sheets['Ventas']
            
            # Formatear columnas monetarias
            from openpyxl.styles import NamedStyle
            currency = NamedStyle(name='currency', number_format='$#,##0.00')
            
            # Aplicar formato a columnas de dinero
            money_columns = ['D', 'H', 'I', 'J', 'M']  # Ajustar según posición
            for col in money_columns:
                for cell in worksheet[col]:
                    cell.style = currency
            
            # Ajustar anchos
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response
    
    def _export_csv(self, data, filename):
        """Crear archivo CSV para ventas"""
        df = pd.DataFrame(data)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        df.to_csv(response, index=False, encoding='utf-8-sig')
        return response

class ExportLocationsView(APIView):
    """Exportar datos de ubicaciones físicas"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            format_type = request.GET.get('export_format', 'excel')
            
            ubicaciones_data = []
            ubicaciones = Ubicacion.objects.select_related('pasillo__zona__almacen').all()
            
            for ubicacion in ubicaciones:
                ubicaciones_data.append({
                    'Codigo_Completo': ubicacion.codigo_completo,
                    'Almacen': ubicacion.pasillo.zona.almacen.nombre,
                    'Codigo_Almacen': ubicacion.pasillo.zona.almacen.codigo,
                    'Zona': ubicacion.pasillo.zona.nombre,
                    'Codigo_Zona': ubicacion.pasillo.zona.codigo,
                    'Tipo_Zona': ubicacion.pasillo.zona.get_tipo_display(),
                    'Pasillo': ubicacion.pasillo.nombre,
                    'Codigo_Pasillo': ubicacion.pasillo.codigo,
                    'Ubicacion': ubicacion.nombre,
                    'Codigo_Ubicacion': ubicacion.codigo,
                    'Tipo_Ubicacion': ubicacion.get_tipo_display(),
                    'Capacidad_Maxima': ubicacion.capacidad_maxima,
                    'Ocupacion_Actual': ubicacion.ocupacion_actual,
                    'Espacios_Libres': ubicacion.espacios_libres,
                    'Nivel': ubicacion.nivel or '',
                    'Posicion': ubicacion.posicion or '',
                    'Largo_CM': float(ubicacion.largo_cm) if ubicacion.largo_cm else '',
                    'Ancho_CM': float(ubicacion.ancho_cm) if ubicacion.ancho_cm else '',
                    'Alto_CM': float(ubicacion.alto_cm) if ubicacion.alto_cm else '',
                    'QR_Generado': 'Sí' if ubicacion.qr_code_generado else 'No',
                    'Activa': 'Sí' if ubicacion.activo else 'No',
                    'Reservada': 'Sí' if ubicacion.reservado else 'No',
                    'Notas': ubicacion.notas or '',
                    'Fecha_Creacion': ubicacion.fecha_creacion.strftime('%Y-%m-%d')
                })
            
            if format_type == 'excel':
                return self._export_excel(ubicaciones_data, 'ubicaciones_fisicas')
            elif format_type == 'csv':
                return self._export_csv(ubicaciones_data, 'ubicaciones_fisicas')
            else:
                return JsonResponse({
                    'data': ubicaciones_data,
                    'total_records': len(ubicaciones_data),
                    'export_date': timezone.now().isoformat()
                }, encoder=DecimalEncoder)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _export_excel(self, data, filename):
        """Crear archivo Excel para ubicaciones"""
        df = pd.DataFrame(data)
        
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Ubicaciones', index=False)
            
            workbook = writer.book
            worksheet = writer.sheets['Ubicaciones']
            
            # Ajustar anchos
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response
    
    def _export_csv(self, data, filename):
        """Crear archivo CSV para ubicaciones"""
        df = pd.DataFrame(data)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        df.to_csv(response, index=False, encoding='utf-8-sig')
        return response

class ExportTemplatesView(APIView):
    """Generar plantillas para importación"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        template_type = request.GET.get('type', 'inventory')
        
        try:
            if template_type == 'inventory':
                return self._create_inventory_template()
            elif template_type == 'sales':
                return self._create_sales_template()
            elif template_type == 'locations':
                return self._create_locations_template()
            else:
                return JsonResponse({'error': 'Tipo de plantilla no válido'}, status=400)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _create_inventory_template(self):
        """Crear plantilla para importar inventario"""
        template_data = [{
            'Marca': 'Honda',
            'Modelo': 'CB190R',
            'Año': 2024,
            'Cilindraje': 190,
            'Color': 'Rojo',
            'Chasis': 'ABC123456789',
            'Precio_Compra': 8000000,
            'Precio_Venta': 9500000,
            'Descuento_Porcentaje': 0,
            'Ubicacion_Codigo': 'ALM001-ZN01-P01-U01',
            'Fecha_Compra': '2024-01-15',
            'Tasa_Dolar': 4000,
            'Observaciones': 'Ejemplo de registro'
        }]
        
        df = pd.DataFrame(template_data)
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Plantilla_Inventario', index=False)
            
            # Agregar hoja de instrucciones
            instructions = pd.DataFrame([
                ['INSTRUCCIONES PARA IMPORTAR INVENTARIO'],
                [''],
                ['1. Complete todos los campos requeridos'],
                ['2. Use el formato de fecha YYYY-MM-DD'],
                ['3. Los códigos de ubicación deben existir previamente'],
                ['4. El chasis debe ser único'],
                ['5. Los precios deben ser números sin puntos ni comas'],
                [''],
                ['CAMPOS REQUERIDOS:'],
                ['- Marca, Modelo, Año, Color, Chasis'],
                ['- Precio_Compra, Precio_Venta'],
                [''],
                ['CAMPOS OPCIONALES:'],
                ['- Cilindraje, Descuento_Porcentaje'],
                ['- Ubicacion_Codigo, Fecha_Compra'],
                ['- Tasa_Dolar, Observaciones']
            ])
            instructions.to_excel(writer, sheet_name='Instrucciones', index=False, header=False)
        
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="plantilla_inventario.xlsx"'
        return response
    
    def _create_sales_template(self):
        """Crear plantilla para importar ventas"""
        template_data = [{
            'Fecha_Venta': '2024-01-15 14:30:00',
            'Cliente_Cedula': '12345678',
            'Cliente_Nombre': 'Juan Pérez',
            'Motocicleta_Chasis': 'ABC123456789',
            'Precio_Venta': 9500000,
            'Descuento': 0,
            'Tipo_Pago': 'contado',
            'Estado_Pago': 'pagado',
            'Observaciones': 'Venta de ejemplo'
        }]
        
        return self._create_template_response(template_data, 'Plantilla_Ventas', 'plantilla_ventas.xlsx')
    
    def _create_locations_template(self):
        """Crear plantilla para importar ubicaciones"""
        template_data = [{
            'Almacen_Codigo': 'ALM001',
            'Zona_Codigo': 'ZN01',
            'Pasillo_Codigo': 'P01',
            'Ubicacion_Codigo': 'U01',
            'Nombre': 'Estante Principal',
            'Tipo': 'estante',
            'Capacidad_Maxima': 2,
            'Nivel': 'A',
            'Posicion': '1',
            'Largo_CM': 200.0,
            'Ancho_CM': 100.0,
            'Alto_CM': 250.0,
            'Notas': 'Ubicación de ejemplo'
        }]
        
        return self._create_template_response(template_data, 'Plantilla_Ubicaciones', 'plantilla_ubicaciones.xlsx')
    
    def _create_template_response(self, data, sheet_name, filename):
        """Crear respuesta de plantilla genérica"""
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ExportClientesView(APIView):
    """Exportar datos de clientes"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            format_type = request.GET.get('export_format', 'excel')
            
            # Obtener todos los clientes
            clientes = Cliente.objects.all()
            clientes_data = []
            
            for cliente in clientes:
                clientes_data.append({
                    'ID': cliente.id,
                    'Cedula': cliente.cedula,
                    'Nombre': cliente.nombre,
                    'Apellido': cliente.apellido,
                    'Email': cliente.email,
                    'Telefono': cliente.telefono,
                    'Direccion': cliente.direccion,
                    'Ciudad': cliente.ciudad,
                    'Fecha_Nacimiento': cliente.fecha_nacimiento.isoformat() if cliente.fecha_nacimiento else '',
                    'Estado_Civil': cliente.estado_civil,
                    'Ocupacion': cliente.ocupacion,
                    'Ingresos_Mensuales': float(cliente.ingresos) if cliente.ingresos else 0,
                    'Referencias_Personales': cliente.referencias_personales,
                    'Fecha_Registro': cliente.fecha_registro.isoformat()
                })
            
            if format_type == 'excel':
                return self._export_excel(clientes_data, 'clientes_export')
            elif format_type == 'csv':
                return self._export_csv(clientes_data, 'clientes_export')
            else:  # json
                return JsonResponse(clientes_data, safe=False, encoder=DecimalEncoder)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _export_excel(self, data, filename):
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Clientes', index=False)
            
            # Ajustar ancho de columnas
            worksheet = writer.sheets['Clientes']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                worksheet.column_dimensions[column_letter].width = min(max_length + 2, 50)
        
        buffer.seek(0)
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d_%H%M")}.xlsx"'
        return response
    
    def _export_csv(self, data, filename):
        df = pd.DataFrame(data)
        buffer = io.StringIO()
        df.to_csv(buffer, index=False, encoding='utf-8')
        buffer.seek(0)
        
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d_%H%M")}.csv"'
        return response


class ExportProveedoresView(APIView):
    """Exportar datos de proveedores"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            format_type = request.GET.get('export_format', 'excel')
            
            proveedores = Proveedor.objects.all()
            proveedores_data = []
            
            for proveedor in proveedores:
                # Calcular estadísticas
                total_motocicletas = proveedor.motocicletas.count()
                total_valor = proveedor.motocicletas.aggregate(
                    total=Sum('precio_compra')
                )['total'] or 0
                
                proveedores_data.append({
                    'ID': proveedor.id,
                    'Nombre': proveedor.nombre,
                    'Contacto': proveedor.persona_contacto or '',
                    'Telefono': proveedor.telefono,
                    'Email': proveedor.email,
                    'Direccion': proveedor.direccion,
                    'Ciudad': proveedor.ciudad,
                    'Pais': proveedor.pais,
                    'RUC': proveedor.ruc or '',
                    'Terminos_Pago': proveedor.terminos_pago,
                    'Descuento_General': float(proveedor.descuento_general) if proveedor.descuento_general else 0,
                    'Limite_Credito': float(proveedor.limite_credito) if proveedor.limite_credito else 0,
                    'Total_Motocicletas': total_motocicletas,
                    'Total_Valor_Inventario': float(total_valor),
                    'Estado': proveedor.estado,
                    'Tipo_Proveedor': proveedor.get_tipo_proveedor_display(),
                    'Fecha_Creacion': proveedor.fecha_creacion.isoformat(),
                    'Notas': proveedor.notas or ''
                })
            
            if format_type == 'excel':
                return self._export_excel(proveedores_data, 'proveedores_export')
            elif format_type == 'csv':
                return self._export_csv(proveedores_data, 'proveedores_export')
            else:  # json
                return JsonResponse(proveedores_data, safe=False, encoder=DecimalEncoder)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _export_excel(self, data, filename):
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Proveedores', index=False)
            
            worksheet = writer.sheets['Proveedores']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                worksheet.column_dimensions[column_letter].width = min(max_length + 2, 50)
        
        buffer.seek(0)
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d_%H%M")}.xlsx"'
        return response
    
    def _export_csv(self, data, filename):
        df = pd.DataFrame(data)
        buffer = io.StringIO()
        df.to_csv(buffer, index=False, encoding='utf-8')
        buffer.seek(0)
        
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d_%H%M")}.csv"'
        return response


class ExportVentasView(APIView):
    """Exportar datos de ventas"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            format_type = request.GET.get('export_format', 'excel')
            fecha_desde = request.GET.get('fecha_desde')
            fecha_hasta = request.GET.get('fecha_hasta')
            
            ventas = Venta.objects.select_related('cliente', 'usuario').prefetch_related('detalles__moto').all()
            
            # Aplicar filtros de fecha
            if fecha_desde:
                ventas = ventas.filter(fecha_venta__gte=fecha_desde)
            if fecha_hasta:
                ventas = ventas.filter(fecha_venta__lte=fecha_hasta)
            
            ventas_data = []
            
            for venta in ventas:
                # Get the first moto from details for main display (could be enhanced to show all details)
                first_detail = venta.detalles.first()
                
                ventas_data.append({
                    'ID_Venta': venta.id,
                    'Fecha_Venta': venta.fecha_venta.isoformat(),
                    'Cliente_Cedula': venta.cliente.cedula if venta.cliente else '',
                    'Cliente_Nombre': f"{venta.cliente.nombre} {venta.cliente.apellido}" if venta.cliente else '',
                    'Cliente_Telefono': venta.cliente.telefono if venta.cliente else '',
                    'Motocicleta_Marca': first_detail.moto.marca if first_detail and first_detail.moto else '',
                    'Motocicleta_Modelo': first_detail.moto.modelo if first_detail and first_detail.moto else '',
                    'Numero_Chasis': first_detail.moto.numero_chasis if first_detail and first_detail.moto and hasattr(first_detail.moto, 'numero_chasis') else '',
                    'Tipo_Venta': venta.tipo_venta,
                    'Monto_Total': float(venta.monto_total),
                    'Monto_Inicial': float(venta.monto_inicial),
                    'Cuotas': venta.cuotas,
                    'Tasa_Interes': float(venta.tasa_interes),
                    'Pago_Mensual': float(venta.pago_mensual),
                    'Monto_Total_Con_Intereses': float(venta.monto_total_con_intereses),
                    'Estado': venta.estado,
                    'Vendedor': f"{venta.usuario.first_name} {venta.usuario.last_name}" if venta.usuario else '',
                    'Motivo_Cancelacion': venta.motivo_cancelacion or '',
                    'Descripcion_Cancelacion': venta.descripcion_cancelacion or ''
                })
            
            if format_type == 'excel':
                return self._export_excel(ventas_data, 'ventas_export')
            elif format_type == 'csv':
                return self._export_csv(ventas_data, 'ventas_export')
            else:  # json
                return JsonResponse(ventas_data, safe=False, encoder=DecimalEncoder)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _export_excel(self, data, filename):
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Ventas', index=False)
            
            worksheet = writer.sheets['Ventas']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                worksheet.column_dimensions[column_letter].width = min(max_length + 2, 50)
        
        buffer.seek(0)
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d_%H%M")}.xlsx"'
        return response
    
    def _export_csv(self, data, filename):
        df = pd.DataFrame(data)
        buffer = io.StringIO()
        df.to_csv(buffer, index=False, encoding='utf-8')
        buffer.seek(0)
        
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d_%H%M")}.csv"'
        return response


class ExportPagosView(APIView):
    """Exportar datos de pagos"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            format_type = request.GET.get('export_format', 'excel')
            fecha_desde = request.GET.get('fecha_desde')
            fecha_hasta = request.GET.get('fecha_hasta')
            
            pagos = Pago.objects.select_related('venta__cliente', 'venta__usuario').prefetch_related('venta__detalles__moto').all()
            
            if fecha_desde:
                pagos = pagos.filter(fecha_pago__gte=fecha_desde)
            if fecha_hasta:
                pagos = pagos.filter(fecha_pago__lte=fecha_hasta)
            
            pagos_data = []
            
            for pago in pagos:
                pagos_data.append({
                    'ID_Pago': pago.id,
                    'Fecha_Pago': pago.fecha_pago.isoformat(),
                    'Venta_ID': pago.venta.id if pago.venta else '',
                    'Cliente_Cedula': pago.venta.cliente.cedula if pago.venta and pago.venta.cliente else '',
                    'Cliente_Nombre': pago.venta.cliente.nombre if pago.venta and pago.venta.cliente else '',
                    'Monto_Pago': float(pago.monto_pagado),
                    'Tipo_Pago': pago.tipo_pago,
                    'Estado': pago.estado,
                    'Usuario_Cobrador': f"{pago.usuario_cobrador.first_name} {pago.usuario_cobrador.last_name}" if pago.usuario_cobrador else '',
                    'Observaciones': pago.observaciones or ''
                })
            
            if format_type == 'excel':
                return self._export_excel(pagos_data, 'pagos_export')
            elif format_type == 'csv':
                return self._export_csv(pagos_data, 'pagos_export')
            else:  # json
                return JsonResponse(pagos_data, safe=False, encoder=DecimalEncoder)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _export_excel(self, data, filename):
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Pagos', index=False)
            
            worksheet = writer.sheets['Pagos']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                worksheet.column_dimensions[column_letter].width = min(max_length + 2, 50)
        
        buffer.seek(0)
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d_%H%M")}.xlsx"'
        return response
    
    def _export_csv(self, data, filename):
        df = pd.DataFrame(data)
        buffer = io.StringIO()
        df.to_csv(buffer, index=False, encoding='utf-8')
        buffer.seek(0)
        
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d_%H%M")}.csv"'
        return response


class ExportDocumentosView(APIView):
    """Exportar datos de documentos"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            format_type = request.GET.get('export_format', 'excel')
            
            # Obtener todos los documentos con información de cliente
            from usuarios.models import Documento
            documentos = Documento.objects.select_related('cliente').all()
            documentos_data = []
            
            for documento in documentos:
                documentos_data.append({
                    'ID': documento.id,
                    'Cliente_Cedula': documento.cliente.cedula if documento.cliente else '',
                    'Cliente_Nombre': f"{documento.cliente.nombre} {documento.cliente.apellido}" if documento.cliente else '',
                    'Propietario': documento.get_propietario_display(),
                    'Tipo_Documento': documento.get_tipo_documento_display(),
                    'Descripcion': documento.descripcion,
                    'Archivo': documento.archivo.url if documento.archivo else '',
                    'Fecha_Creacion': documento.fecha_creacion.isoformat()
                })
            
            if format_type == 'excel':
                return self._export_excel(documentos_data, 'documentos_export')
            elif format_type == 'csv':
                return self._export_csv(documentos_data, 'documentos_export')
            else:  # json
                return JsonResponse(documentos_data, safe=False, encoder=DecimalEncoder)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)