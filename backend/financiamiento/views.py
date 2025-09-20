from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Sum, Count, Avg
from django.db import transaction
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
import calendar

from .models import (
    EntidadFinanciera, TipoCredito, SolicitudCredito, DocumentoCredito,
    HistorialCredito, EsquemaComision, ComisionCalculada, MetaVendedor,
    AsignacionComision
)
from .serializers import (
    EntidadFinancieraSerializer, SolicitudCreditoSerializer, 
    DocumentoCreditoSerializer, CalculadoraCreditoSerializer,
    EsquemaComisionSerializer, ComisionCalculadaSerializer, 
    MetaVendedorSerializer, ResumenComisionesSerializer,
    AsignacionComisionSerializer
)
from .services import CalculadoraFinanciera, ComisionService
from usuarios.models import Usuario
from ventas.models import Venta


# ========================
# VISTAS DE FINANCIAMIENTO
# ========================

class EntidadesFinancierasListView(generics.ListAPIView):
    """Lista todas las entidades financieras activas"""
    queryset = EntidadFinanciera.objects.filter(activa=True).prefetch_related('tipos_credito')
    serializer_class = EntidadFinancieraSerializer
    permission_classes = [permissions.IsAuthenticated]


class CalculadoraCreditoView(APIView):
    """Calculadora de cuotas y simulación de crédito"""
    permission_classes = [permissions.AllowAny]  # Acceso público para simulación
    
    def post(self, request):
        serializer = CalculadoraCreditoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        calculadora = CalculadoraFinanciera()
        
        try:
            resultado = calculadora.calcular_credito(
                monto=data['monto'],
                inicial=data['inicial'],
                tasa_anual=data['tasa'],
                plazo_meses=data['plazo']
            )
            
            return Response(resultado)
            
        except Exception as e:
            return Response(
                {'error': f'Error en el cálculo: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SolicitudCreditoListCreateView(generics.ListCreateAPIView):
    """Lista y crea solicitudes de crédito"""
    serializer_class = SolicitudCreditoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = SolicitudCredito.objects.select_related(
            'cliente', 'venta', 'entidad_financiera', 'tipo_credito', 
            'vendedor', 'usuario_creacion'
        ).prefetch_related('documentos', 'historial')
        
        # Filtros
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
            
        cliente_id = self.request.query_params.get('cliente')
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
            
        vendedor_id = self.request.query_params.get('vendedor')
        if vendedor_id:
            queryset = queryset.filter(vendedor_id=vendedor_id)
            
        entidad_id = self.request.query_params.get('entidad')
        if entidad_id:
            queryset = queryset.filter(entidad_financiera_id=entidad_id)
        
        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_solicitud__gte=fecha_desde)
            
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_solicitud__lte=fecha_hasta)
        
        return queryset.order_by('-fecha_solicitud')


class SolicitudCreditoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualización y eliminación de solicitudes de crédito"""
    queryset = SolicitudCredito.objects.all()
    serializer_class = SolicitudCreditoSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProcesarSolicitudView(APIView):
    """Procesar solicitud de crédito (enviar a entidad financiera)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        solicitud = get_object_or_404(SolicitudCredito, pk=pk)
        
        if solicitud.estado != 'borrador':
            return Response(
                {'error': 'Solo se pueden procesar solicitudes en estado borrador'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar documentos requeridos
        docs_faltantes = self._validar_documentos(solicitud)
        if docs_faltantes:
            return Response({
                'error': 'Faltan documentos requeridos',
                'documentos_faltantes': docs_faltantes
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Cambiar estado
                solicitud.estado = 'enviada'
                solicitud.fecha_envio = timezone.now()
                solicitud.save()
                
                # Crear registro en historial
                HistorialCredito.objects.create(
                    solicitud=solicitud,
                    estado_anterior='borrador',
                    estado_nuevo='enviada',
                    usuario=request.user,
                    observaciones='Solicitud enviada a entidad financiera'
                )
                
                # Aquí iría la integración con la API externa de la entidad
                # Por ahora simulamos con un número de referencia
                numero_referencia = f"REF-{solicitud.numero_solicitud.hex[:8].upper()}"
                solicitud.numero_credito_externo = numero_referencia
                solicitud.save()
                
                return Response({
                    'message': 'Solicitud enviada exitosamente',
                    'numero_referencia': numero_referencia,
                    'estado': 'enviada'
                })
                
        except Exception as e:
            return Response(
                {'error': f'Error al procesar solicitud: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _validar_documentos(self, solicitud):
        """Valida que estén todos los documentos requeridos"""
        documentos_subidos = list(solicitud.documentos.values_list('tipo', flat=True))
        
        # Documentos básicos siempre requeridos
        requeridos_basicos = ['cedula', 'ingresos', 'laborales']
        
        # Documentos específicos según tipo de crédito
        if solicitud.tipo_credito.requiere_centrales_riesgo:
            requeridos_basicos.append('centrales_riesgo')
        if solicitud.tipo_credito.requiere_referencias_comerciales:
            requeridos_basicos.append('comerciales')
        if solicitud.tipo_credito.requiere_referencias_familiares:
            requeridos_basicos.append('familiares')
        
        faltantes = [doc for doc in requeridos_basicos if doc not in documentos_subidos]
        return faltantes


class ActualizarEstadoSolicitudView(APIView):
    """Actualizar estado de solicitud (webhook desde entidades financieras)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        solicitud = get_object_or_404(SolicitudCredito, pk=pk)
        nuevo_estado = request.data.get('estado')
        observaciones = request.data.get('observaciones', '')
        
        # Validar estados permitidos
        estados_validos = dict(SolicitudCredito.ESTADOS)
        if nuevo_estado not in estados_validos:
            return Response(
                {'error': 'Estado no válido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        estado_anterior = solicitud.estado
        
        try:
            with transaction.atomic():
                # Actualizar solicitud
                solicitud.estado = nuevo_estado
                
                if nuevo_estado == 'aprobada':
                    solicitud.fecha_respuesta = timezone.now()
                    # Actualizar datos de aprobación si vienen en la request
                    if 'monto_aprobado' in request.data:
                        solicitud.monto_aprobado = request.data['monto_aprobado']
                    if 'tasa_aprobada' in request.data:
                        solicitud.tasa_aprobada = request.data['tasa_aprobada']
                    if 'cuota_mensual' in request.data:
                        solicitud.cuota_mensual = request.data['cuota_mensual']
                
                elif nuevo_estado == 'rechazada':
                    solicitud.fecha_respuesta = timezone.now()
                    solicitud.motivo_rechazo = request.data.get('motivo_rechazo', '')
                
                elif nuevo_estado == 'desembolsada':
                    solicitud.fecha_desembolso = timezone.now()
                
                solicitud.save()
                
                # Crear registro en historial
                HistorialCredito.objects.create(
                    solicitud=solicitud,
                    estado_anterior=estado_anterior,
                    estado_nuevo=nuevo_estado,
                    usuario=request.user,
                    observaciones=observaciones
                )
                
                return Response({
                    'message': 'Estado actualizado exitosamente',
                    'estado_anterior': estado_anterior,
                    'estado_nuevo': nuevo_estado
                })
                
        except Exception as e:
            return Response(
                {'error': f'Error al actualizar estado: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentosCreditoView(generics.ListCreateAPIView):
    """Lista y sube documentos para una solicitud de crédito"""
    serializer_class = DocumentoCreditoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        solicitud_id = self.kwargs.get('solicitud_id')
        return DocumentoCredito.objects.filter(solicitud_id=solicitud_id)
    
    def perform_create(self, serializer):
        solicitud_id = self.kwargs.get('solicitud_id')
        solicitud = get_object_or_404(SolicitudCredito, pk=solicitud_id)
        serializer.save(solicitud=solicitud, usuario_subida=self.request.user)


class EstadisticasFinanciamientoView(APIView):
    """Estadísticas del módulo de financiamiento"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Período (por defecto último mes)
            fecha_fin = timezone.now().date()
            fecha_inicio = fecha_fin - timedelta(days=30)
            
            if request.query_params.get('fecha_inicio'):
                fecha_inicio = datetime.strptime(
                    request.query_params.get('fecha_inicio'), '%Y-%m-%d'
                ).date()
            if request.query_params.get('fecha_fin'):
                fecha_fin = datetime.strptime(
                    request.query_params.get('fecha_fin'), '%Y-%m-%d'
                ).date()
            
            solicitudes = SolicitudCredito.objects.filter(
                fecha_solicitud__date__range=[fecha_inicio, fecha_fin]
            )
            
            # Estadísticas generales
            total_solicitudes = solicitudes.count()
            aprobadas = solicitudes.filter(estado='aprobada').count()
            rechazadas = solicitudes.filter(estado='rechazada').count()
            en_proceso = solicitudes.filter(
                estado__in=['enviada', 'en_evaluacion', 'documentos_pendientes']
            ).count()
            
            # Montos
            monto_total_solicitado = solicitudes.aggregate(
                total=Sum('monto_solicitado')
            )['total'] or 0
            
            monto_aprobado = solicitudes.filter(estado='aprobada').aggregate(
                total=Sum('monto_aprobado')
            )['total'] or 0
            
            # Tasa de aprobación
            tasa_aprobacion = (aprobadas / total_solicitudes * 100) if total_solicitudes > 0 else 0
            
            # Por entidad financiera
            por_entidad = list(solicitudes.values(
                'entidad_financiera__nombre'
            ).annotate(
                total=Count('id'),
                aprobadas=Count('id', filter=Q(estado='aprobada')),
                monto_total=Sum('monto_solicitado')
            ).order_by('-total'))
            
            return Response({
                'resumen': {
                    'total_solicitudes': total_solicitudes,
                    'aprobadas': aprobadas,
                    'rechazadas': rechazadas,
                    'en_proceso': en_proceso,
                    'monto_total_solicitado': float(monto_total_solicitado),
                    'monto_aprobado': float(monto_aprobado),
                    'tasa_aprobacion': round(tasa_aprobacion, 2)
                },
                'por_entidad': por_entidad,
                'periodo': {
                    'fecha_inicio': fecha_inicio,
                    'fecha_fin': fecha_fin
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar estadísticas: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========================
# VISTAS DE COMISIONES
# ========================

class EsquemaComisionListCreateView(generics.ListCreateAPIView):
    """Lista y crea esquemas de comisión"""
    queryset = EsquemaComision.objects.filter(activo=True).prefetch_related('tramos')
    serializer_class = EsquemaComisionSerializer
    permission_classes = [permissions.IsAuthenticated]


class EsquemaComisionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualización y eliminación de esquemas de comisión"""
    queryset = EsquemaComision.objects.all()
    serializer_class = EsquemaComisionSerializer
    permission_classes = [permissions.IsAuthenticated]


class AsignacionComisionListCreateView(generics.ListCreateAPIView):
    """Lista y crea asignaciones de comisión"""
    serializer_class = AsignacionComisionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = AsignacionComision.objects.select_related(
            'vendedor', 'esquema', 'creado_por'
        )
        
        vendedor_id = self.request.query_params.get('vendedor')
        if vendedor_id:
            queryset = queryset.filter(vendedor_id=vendedor_id)
            
        activa = self.request.query_params.get('activa')
        if activa is not None:
            queryset = queryset.filter(activa=activa.lower() == 'true')
        
        return queryset.order_by('-fecha_creacion')


class ComisionCalculadaListView(generics.ListAPIView):
    """Lista comisiones calculadas con filtros"""
    serializer_class = ComisionCalculadaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ComisionCalculada.objects.select_related(
            'venta', 'vendedor', 'esquema_aplicado', 'venta__cliente',
            'aprobada_por', 'pagada_por'
        )
        
        # Filtros
        vendedor_id = self.request.query_params.get('vendedor')
        if vendedor_id:
            queryset = queryset.filter(vendedor_id=vendedor_id)
            
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
            
        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_calculo__gte=fecha_desde)
            
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_calculo__lte=fecha_hasta)
        
        return queryset.order_by('-fecha_calculo')


class CalcularComisionView(APIView):
    """Calcular comisión para una venta específica"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, venta_id):
        try:
            venta = get_object_or_404(Venta, pk=venta_id)
            
            # Verificar que no exista ya una comisión calculada
            if hasattr(venta, 'comision'):
                return Response(
                    {'error': 'Esta venta ya tiene una comisión calculada'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            comision_service = ComisionService()
            comision = comision_service.calcular_comision_venta(venta)
            
            serializer = ComisionCalculadaSerializer(comision)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Error al calcular comisión: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AprobarComisionView(APIView):
    """Aprobar una comisión calculada"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        comision = get_object_or_404(ComisionCalculada, pk=pk)
        
        if comision.estado != 'calculada':
            return Response(
                {'error': 'Solo se pueden aprobar comisiones en estado calculada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comision.estado = 'aprobada'
        comision.fecha_aprobacion = timezone.now()
        comision.aprobada_por = request.user
        comision.observaciones = request.data.get('observaciones', comision.observaciones)
        comision.save()
        
        serializer = ComisionCalculadaSerializer(comision)
        return Response(serializer.data)


class PagarComisionView(APIView):
    """Marcar comisión como pagada"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        comision = get_object_or_404(ComisionCalculada, pk=pk)
        
        if comision.estado != 'aprobada':
            return Response(
                {'error': 'Solo se pueden marcar como pagadas las comisiones aprobadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comision.estado = 'pagada'
        comision.fecha_pago = timezone.now()
        comision.pagada_por = request.user
        comision.numero_pago = request.data.get('numero_pago', '')
        comision.observaciones = request.data.get('observaciones', comision.observaciones)
        comision.save()
        
        serializer = ComisionCalculadaSerializer(comision)
        return Response(serializer.data)


class MetaVendedorListCreateView(generics.ListCreateAPIView):
    """Lista y crea metas de vendedores"""
    serializer_class = MetaVendedorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = MetaVendedor.objects.select_related('vendedor', 'creado_por')
        
        vendedor_id = self.request.query_params.get('vendedor')
        if vendedor_id:
            queryset = queryset.filter(vendedor_id=vendedor_id)
            
        ano = self.request.query_params.get('ano')
        if ano:
            queryset = queryset.filter(ano=ano)
            
        periodo = self.request.query_params.get('periodo')
        if periodo:
            queryset = queryset.filter(periodo=periodo)
        
        return queryset.order_by('-ano', '-mes')


class ResumenComisionesVendedorView(APIView):
    """Resumen de comisiones para un vendedor en un período"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, vendedor_id):
        try:
            vendedor = get_object_or_404(Usuario, pk=vendedor_id)
            
            # Período (por defecto mes actual)
            fecha_fin = timezone.now().date()
            fecha_inicio = fecha_fin.replace(day=1)  # Primer día del mes
            
            if request.query_params.get('fecha_inicio'):
                fecha_inicio = datetime.strptime(
                    request.query_params.get('fecha_inicio'), '%Y-%m-%d'
                ).date()
            if request.query_params.get('fecha_fin'):
                fecha_fin = datetime.strptime(
                    request.query_params.get('fecha_fin'), '%Y-%m-%d'
                ).date()
            
            comisiones = ComisionCalculada.objects.filter(
                vendedor=vendedor,
                fecha_calculo__date__range=[fecha_inicio, fecha_fin]
            )
            
            # Cálculos
            total_ventas = comisiones.count()
            total_monto_ventas = comisiones.aggregate(Sum('monto_venta'))['monto_venta__sum'] or 0
            total_comisiones = comisiones.aggregate(Sum('comision_total'))['comision_total__sum'] or 0
            
            comision_ventas = comisiones.aggregate(Sum('comision_venta'))['comision_venta__sum'] or 0
            comision_financiamiento = comisiones.aggregate(Sum('comision_financiamiento'))['comision_financiamiento__sum'] or 0
            
            # Por estado
            calculadas = comisiones.filter(estado='calculada').aggregate(Sum('comision_total'))['comision_total__sum'] or 0
            aprobadas = comisiones.filter(estado='aprobada').aggregate(Sum('comision_total'))['comision_total__sum'] or 0
            pagadas = comisiones.filter(estado='pagada').aggregate(Sum('comision_total'))['comision_total__sum'] or 0
            pendientes = calculadas + aprobadas
            
            data = {
                'vendedor_id': vendedor.id,
                'vendedor_nombre': vendedor.get_full_name(),
                'periodo_inicio': fecha_inicio,
                'periodo_fin': fecha_fin,
                'total_ventas': total_ventas,
                'total_monto_ventas': float(total_monto_ventas),
                'total_comisiones': float(total_comisiones),
                'comision_ventas': float(comision_ventas),
                'comision_financiamiento': float(comision_financiamiento),
                'bonificaciones': 0,  # TODO: Implementar bonificaciones
                'comisiones_calculadas': float(calculadas),
                'comisiones_aprobadas': float(aprobadas),
                'comisiones_pagadas': float(pagadas),
                'comisiones_pendientes': float(pendientes)
            }
            
            serializer = ResumenComisionesSerializer(data)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar resumen: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EstadisticasComisionesView(APIView):
    """Estadísticas generales del sistema de comisiones"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Período (por defecto último mes)
            fecha_fin = timezone.now().date()
            fecha_inicio = fecha_fin - timedelta(days=30)
            
            if request.query_params.get('fecha_inicio'):
                fecha_inicio = datetime.strptime(
                    request.query_params.get('fecha_inicio'), '%Y-%m-%d'
                ).date()
            if request.query_params.get('fecha_fin'):
                fecha_fin = datetime.strptime(
                    request.query_params.get('fecha_fin'), '%Y-%m-%d'
                ).date()
            
            comisiones = ComisionCalculada.objects.filter(
                fecha_calculo__date__range=[fecha_inicio, fecha_fin]
            )
            
            # Estadísticas generales
            total_comisiones = comisiones.count()
            monto_total = comisiones.aggregate(Sum('comision_total'))['comision_total__sum'] or 0
            monto_promedio = comisiones.aggregate(Avg('comision_total'))['comision_total__avg'] or 0
            
            # Por estado
            por_estado = list(comisiones.values('estado').annotate(
                cantidad=Count('id'),
                monto=Sum('comision_total')
            ).order_by('estado'))
            
            # Por vendedor (top 10)
            por_vendedor = list(comisiones.values(
                'vendedor__first_name', 'vendedor__last_name'
            ).annotate(
                total_comisiones=Sum('comision_total'),
                total_ventas=Count('id')
            ).order_by('-total_comisiones')[:10])
            
            return Response({
                'resumen': {
                    'total_comisiones': total_comisiones,
                    'monto_total': float(monto_total),
                    'monto_promedio': float(monto_promedio)
                },
                'por_estado': por_estado,
                'top_vendedores': por_vendedor,
                'periodo': {
                    'fecha_inicio': fecha_inicio,
                    'fecha_fin': fecha_fin
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar estadísticas: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )