from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
import pandas as pd
import json
import uuid
from datetime import datetime
from .models import (
    MotoModelo, MotoInventario, Proveedor,
    Almacen, Zona, Pasillo, Ubicacion
)
from .serializers import (
    MotoModeloSerializer, MotoInventarioSerializer, ProveedorSerializer,
    AlmacenSerializer, ZonaSerializer, PasilloSerializer, UbicacionSerializer
)


class ImportValidationMixin:
    """Mixin para validación común de importaciones"""
    
    def validate_file_format(self, file_obj):
        """Valida el formato del archivo"""
        if not file_obj:
            return False, "No se proporcionó archivo"
        
        filename = file_obj.name.lower()
        if not (filename.endswith('.xlsx') or filename.endswith('.csv') or filename.endswith('.json')):
            return False, "Formato de archivo no soportado. Use Excel (.xlsx), CSV (.csv) o JSON (.json)"
        
        return True, "OK"
    
    def read_file_data(self, file_obj):
        """Lee datos del archivo según su formato"""
        filename = file_obj.name.lower()
        
        try:
            if filename.endswith('.xlsx'):
                df = pd.read_excel(file_obj)
                return df.to_dict('records'), None
            elif filename.endswith('.csv'):
                df = pd.read_csv(file_obj)
                return df.to_dict('records'), None
            elif filename.endswith('.json'):
                data = json.load(file_obj)
                return data, None
        except Exception as e:
            return None, f"Error al leer archivo: {str(e)}"
    
    def validate_required_columns(self, data, required_columns):
        """Valida que existan las columnas requeridas"""
        if not data:
            return False, "Archivo vacío"
        
        first_row = data[0] if isinstance(data, list) else data
        missing_columns = [col for col in required_columns if col not in first_row]
        
        if missing_columns:
            return False, f"Columnas faltantes: {', '.join(missing_columns)}"
        
        return True, "OK"


class ImportInventoryView(APIView, ImportValidationMixin):
    """Vista para importar inventario de motocicletas"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Validar archivo
            file_obj = request.FILES.get('file')
            is_valid, message = self.validate_file_format(file_obj)
            if not is_valid:
                return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
            
            # Leer datos
            data, error = self.read_file_data(file_obj)
            if error:
                return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar columnas requeridas
            required_columns = ['marca', 'modelo', 'color', 'precio_venta', 'numero_chasis']
            is_valid, message = self.validate_required_columns(data, required_columns)
            if not is_valid:
                return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
            
            # Procesar datos
            preview_mode = request.data.get('preview', 'false').lower() == 'true'
            
            if preview_mode:
                return self.preview_import(data)
            else:
                return self.execute_import(data)
                
        except Exception as e:
            return Response(
                {'error': f'Error durante la importación: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def preview_import(self, data):
        """Muestra una vista previa de los datos a importar"""
        preview_items = []
        errors = []
        
        for i, row in enumerate(data[:10]):  # Mostrar solo primeros 10
            item = {
                'row': i + 1,
                'marca': row.get('marca', ''),
                'modelo': row.get('modelo', ''),
                'color': row.get('color', ''),
                'precio_venta': row.get('precio_venta', ''),
                'numero_chasis': row.get('numero_chasis', ''),
                'status': 'pending'
            }
            
            # Validaciones básicas
            row_errors = []
            if not row.get('marca'):
                row_errors.append('Marca requerida')
            if not row.get('modelo'):
                row_errors.append('Modelo requerido')
            if not row.get('numero_chasis'):
                row_errors.append('Número de chasis requerido')
            
            # Verificar duplicados
            if MotoInventario.objects.filter(numero_chasis=row.get('numero_chasis')).exists():
                row_errors.append('Chasis ya existe')
            
            if row_errors:
                item['status'] = 'error'
                item['errors'] = row_errors
                errors.extend([f"Fila {i+1}: {err}" for err in row_errors])
            else:
                item['status'] = 'ok'
            
            preview_items.append(item)
        
        return Response({
            'preview': True,
            'total_rows': len(data),
            'preview_rows': len(preview_items),
            'items': preview_items,
            'errors': errors,
            'can_import': len(errors) == 0
        })
    
    def execute_import(self, data):
        """Ejecuta la importación real"""
        created_count = 0
        error_count = 0
        errors = []
        
        with transaction.atomic():
            try:
                for i, row in enumerate(data):
                    try:
                        # Obtener o crear modelo
                        modelo, created_modelo = MotoModelo.objects.get_or_create(
                            marca=row['marca'],
                            modelo=row['modelo'],
                            defaults={
                                'cilindrada': row.get('cilindrada', 150),
                                'tipo': row.get('tipo', 'scooter'),
                                'precio_base': row.get('precio_base', row.get('precio_venta', 0))
                            }
                        )
                        
                        # Obtener proveedor si se especifica
                        proveedor = None
                        if row.get('proveedor'):
                            proveedor, _ = Proveedor.objects.get_or_create(
                                nombre=row['proveedor'],
                                defaults={
                                    'contacto': row.get('contacto_proveedor', ''),
                                    'telefono': row.get('telefono_proveedor', ''),
                                    'email': row.get('email_proveedor', ''),
                                    'activo': True
                                }
                            )
                        
                        # Crear inventario
                        inventario = MotoInventario.objects.create(
                            modelo=modelo,
                            color=row['color'],
                            numero_chasis=row['numero_chasis'],
                            precio_venta=row['precio_venta'],
                            precio_costo=row.get('precio_costo', row['precio_venta'] * 0.8),
                            proveedor=proveedor,
                            disponible=row.get('disponible', True),
                            notas=row.get('notas', f'Importado el {timezone.now().date()}')
                        )
                        
                        created_count += 1
                        
                    except Exception as e:
                        error_count += 1
                        errors.append(f"Fila {i+1}: {str(e)}")
                        
                return Response({
                    'success': True,
                    'created_count': created_count,
                    'error_count': error_count,
                    'errors': errors,
                    'message': f'Importación completada. {created_count} registros creados, {error_count} errores.'
                })
                
            except Exception as e:
                transaction.rollback()
                return Response(
                    {'error': f'Error en la transacción: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )


class ImportLocationsView(APIView, ImportValidationMixin):
    """Vista para importar ubicaciones físicas"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Validar archivo
            file_obj = request.FILES.get('file')
            is_valid, message = self.validate_file_format(file_obj)
            if not is_valid:
                return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
            
            # Leer datos
            data, error = self.read_file_data(file_obj)
            if error:
                return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar columnas requeridas
            required_columns = ['almacen_nombre', 'zona_nombre', 'pasillo_nombre', 'ubicacion_nombre']
            is_valid, message = self.validate_required_columns(data, required_columns)
            if not is_valid:
                return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
            
            # Procesar datos
            preview_mode = request.data.get('preview', 'false').lower() == 'true'
            
            if preview_mode:
                return self.preview_import(data)
            else:
                return self.execute_import(data)
                
        except Exception as e:
            return Response(
                {'error': f'Error durante la importación: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def preview_import(self, data):
        """Vista previa de ubicaciones"""
        preview_items = []
        errors = []
        
        for i, row in enumerate(data[:10]):
            item = {
                'row': i + 1,
                'almacen_nombre': row.get('almacen_nombre', ''),
                'zona_nombre': row.get('zona_nombre', ''),
                'pasillo_nombre': row.get('pasillo_nombre', ''),
                'ubicacion_nombre': row.get('ubicacion_nombre', ''),
                'status': 'pending'
            }
            
            # Validaciones
            row_errors = []
            if not row.get('almacen_nombre'):
                row_errors.append('Nombre de almacén requerido')
            if not row.get('zona_nombre'):
                row_errors.append('Nombre de zona requerido')
            if not row.get('ubicacion_nombre'):
                row_errors.append('Nombre de ubicación requerido')
            
            if row_errors:
                item['status'] = 'error'
                item['errors'] = row_errors
                errors.extend([f"Fila {i+1}: {err}" for err in row_errors])
            else:
                item['status'] = 'ok'
            
            preview_items.append(item)
        
        return Response({
            'preview': True,
            'total_rows': len(data),
            'preview_rows': len(preview_items),
            'items': preview_items,
            'errors': errors,
            'can_import': len(errors) == 0
        })
    
    def execute_import(self, data):
        """Ejecuta la importación de ubicaciones"""
        created_count = 0
        error_count = 0
        errors = []
        
        with transaction.atomic():
            try:
                for i, row in enumerate(data):
                    try:
                        # Obtener o crear almacén
                        almacen, _ = Almacen.objects.get_or_create(
                            nombre=row['almacen_nombre'],
                            defaults={
                                'codigo': row.get('almacen_codigo', row['almacen_nombre'][:10]),
                                'direccion': row.get('almacen_direccion', ''),
                                'descripcion': row.get('almacen_descripcion', ''),
                                'activo': True
                            }
                        )
                        
                        # Obtener o crear zona
                        zona, _ = Zona.objects.get_or_create(
                            almacen=almacen,
                            nombre=row['zona_nombre'],
                            defaults={
                                'codigo': row.get('zona_codigo', row['zona_nombre'][:10]),
                                'tipo': row.get('zona_tipo', 'almacenamiento'),
                                'capacidad_maxima': row.get('zona_capacidad', 100),
                                'descripcion': row.get('zona_descripcion', ''),
                                'activo': True
                            }
                        )
                        
                        # Obtener o crear pasillo
                        pasillo, _ = Pasillo.objects.get_or_create(
                            zona=zona,
                            nombre=row.get('pasillo_nombre', 'A'),
                            defaults={
                                'codigo': row.get('pasillo_codigo', row.get('pasillo_nombre', 'A')),
                                'numero_orden': row.get('pasillo_orden', 1),
                                'activo': True
                            }
                        )
                        
                        # Crear ubicación
                        ubicacion = Ubicacion.objects.create(
                            pasillo=pasillo,
                            nombre=row['ubicacion_nombre'],
                            codigo=row.get('ubicacion_codigo', row['ubicacion_nombre']),
                            tipo=row.get('ubicacion_tipo', 'estante'),
                            nivel=row.get('ubicacion_nivel', ''),
                            posicion=row.get('ubicacion_posicion', ''),
                            capacidad_maxima=row.get('ubicacion_capacidad', 1),
                            largo_cm=row.get('largo_cm'),
                            ancho_cm=row.get('ancho_cm'),
                            alto_cm=row.get('alto_cm'),
                            notas=row.get('ubicacion_notas', f'Importado el {timezone.now().date()}')
                        )
                        
                        created_count += 1
                        
                    except Exception as e:
                        error_count += 1
                        errors.append(f"Fila {i+1}: {str(e)}")
                        
                return Response({
                    'success': True,
                    'created_count': created_count,
                    'error_count': error_count,
                    'errors': errors,
                    'message': f'Importación completada. {created_count} ubicaciones creadas, {error_count} errores.'
                })
                
            except Exception as e:
                transaction.rollback()
                return Response(
                    {'error': f'Error en la transacción: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )


class ImportValidationView(APIView):
    """Vista para validar archivos de importación sin procesarlos"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            file_obj = request.FILES.get('file')
            import_type = request.data.get('type', 'inventory')
            
            if not file_obj:
                return Response(
                    {'error': 'No se proporcionó archivo'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar formato
            filename = file_obj.name.lower()
            if not (filename.endswith('.xlsx') or filename.endswith('.csv') or filename.endswith('.json')):
                return Response(
                    {'error': 'Formato no soportado'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Leer datos para validación
            try:
                if filename.endswith('.xlsx'):
                    df = pd.read_excel(file_obj)
                    data = df.to_dict('records')
                elif filename.endswith('.csv'):
                    df = pd.read_csv(file_obj)
                    data = df.to_dict('records')
                elif filename.endswith('.json'):
                    data = json.load(file_obj)
                
                # Validar según el tipo
                if import_type == 'inventory':
                    required_columns = ['marca', 'modelo', 'color', 'precio_venta', 'numero_chasis']
                elif import_type == 'locations':
                    required_columns = ['almacen_nombre', 'zona_nombre', 'pasillo_nombre', 'ubicacion_nombre']
                else:
                    return Response(
                        {'error': 'Tipo de importación no válido'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Verificar columnas
                if data:
                    first_row = data[0]
                    missing_columns = [col for col in required_columns if col not in first_row]
                    
                    if missing_columns:
                        return Response({
                            'valid': False,
                            'error': f'Columnas faltantes: {", ".join(missing_columns)}',
                            'required_columns': required_columns,
                            'found_columns': list(first_row.keys()) if first_row else []
                        })
                    
                    return Response({
                        'valid': True,
                        'total_rows': len(data),
                        'columns': list(first_row.keys()),
                        'sample_data': data[:5]  # Muestra primeros 5 registros
                    })
                else:
                    return Response(
                        {'valid': False, 'error': 'Archivo vacío'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except Exception as e:
                return Response(
                    {'valid': False, 'error': f'Error al leer archivo: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error de validación: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )