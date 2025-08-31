from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Q
from django_filters.rest_framework import DjangoFilterBackend
from django.template.loader import render_to_string
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.units import inch
import io
from datetime import date, timedelta, datetime

from .models import (
    Proveedor, FacturaProveedor, PagoProveedor, 
    OrdenCompra, DetalleOrdenCompra, MotoModelo, MotoInventario
)
from .serializers import (
    FacturaProveedorSerializer, PagoProveedorSerializer,
    OrdenCompraSerializer, DetalleOrdenCompraSerializer
)

# ===== VISTAS DE FACTURAS =====

class FacturaProveedorListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear facturas de proveedores"""
    queryset = FacturaProveedor.objects.all()
    serializer_class = FacturaProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'estado', 'tipo_factura']
    search_fields = ['numero_factura', 'proveedor__nombre', 'descripcion']
    ordering_fields = ['fecha_emision', 'fecha_vencimiento', 'total']
    ordering = ['-fecha_emision']

class FacturaProveedorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para detalles de factura de proveedor"""
    queryset = FacturaProveedor.objects.all()
    serializer_class = FacturaProveedorSerializer
    permission_classes = [IsAuthenticated]

# ===== VISTAS DE PAGOS =====

class PagoProveedorListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear pagos a proveedores"""
    queryset = PagoProveedor.objects.all()
    serializer_class = PagoProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'metodo_pago', 'factura']
    search_fields = ['numero_pago', 'proveedor__nombre', 'numero_referencia']
    ordering_fields = ['fecha_pago', 'monto']
    ordering = ['-fecha_pago']

class PagoProveedorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para detalles de pago a proveedor"""
    queryset = PagoProveedor.objects.all()
    serializer_class = PagoProveedorSerializer
    permission_classes = [IsAuthenticated]

# ===== VISTAS DE ÓRDENES DE COMPRA =====

class OrdenCompraListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear órdenes de compra"""
    queryset = OrdenCompra.objects.all()
    serializer_class = OrdenCompraSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'prioridad']
    search_fields = ['numero_orden', 'proveedor__nombre', 'notas']
    ordering_fields = ['fecha_orden', 'fecha_entrega_esperada', 'total']
    ordering = ['-fecha_orden']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        estados = self.request.GET.get('estado')
        
        if estados:
            # Handle comma-separated estados
            estados_list = [estado.strip() for estado in estados.split(',')]
            queryset = queryset.filter(estado__in=estados_list)
            
        return queryset

class OrdenCompraDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para detalles de orden de compra"""
    queryset = OrdenCompra.objects.all()
    serializer_class = OrdenCompraSerializer
    permission_classes = [IsAuthenticated]

class DetalleOrdenCompraListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear detalles de orden de compra"""
    queryset = DetalleOrdenCompra.objects.all()
    serializer_class = DetalleOrdenCompraSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['orden', 'modelo_moto']

# ===== VISTAS DE REPORTES Y ESTADÍSTICAS =====

class EstadisticasProveedorView(APIView):
    """Vista para estadísticas financieras de un proveedor"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, proveedor_id):
        proveedor = get_object_or_404(Proveedor, id=proveedor_id)
        
        # Facturas
        facturas_pendientes = proveedor.facturas_proveedor.filter(estado='pendiente')
        facturas_vencidas = proveedor.facturas_proveedor.filter(estado='pendiente', fecha_vencimiento__lt=date.today())
        
        # Totales
        total_deuda = facturas_pendientes.aggregate(total=Sum('total'))['total'] or 0
        total_vencido = facturas_vencidas.aggregate(total=Sum('total'))['total'] or 0
        
        # Pagos últimos 30 días
        fecha_30_dias = date.today() - timedelta(days=30)
        pagos_recientes = proveedor.pagos_realizados.filter(fecha_pago__gte=fecha_30_dias)
        total_pagado_reciente = pagos_recientes.aggregate(total=Sum('monto'))['total'] or 0
        
        # Órdenes
        ordenes_pendientes = proveedor.ordenes_compra.exclude(estado__in=['recibida_completa', 'cancelada'])
        
        return Response({
            'proveedor': proveedor.nombre_completo,
            'limite_credito': proveedor.limite_credito or 0,
            'credito_disponible': proveedor.credito_disponible(),
            'total_deuda': total_deuda,
            'total_vencido': total_vencido,
            'facturas_pendientes_count': facturas_pendientes.count(),
            'facturas_vencidas_count': facturas_vencidas.count(),
            'total_pagado_30_dias': total_pagado_reciente,
            'ordenes_pendientes_count': ordenes_pendientes.count(),
            'total_motocicletas': proveedor.total_motocicletas(),
            'total_compras': proveedor.total_compras(),
        })

# ===== VISTAS DE RE-STOCK Y PEDIDOS =====

class SugerenciasRestockView(APIView):
    """Vista para sugerencias de re-stock basadas en inventario"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Filtros
        stock_minimo = int(request.GET.get('stock_minimo', 5))
        proveedor_id = request.GET.get('proveedor')
        
        # Base queryset
        modelos_query = MotoModelo.objects.filter(activa=True)
        if proveedor_id:
            modelos_query = modelos_query.filter(proveedor_id=proveedor_id)
        
        sugerencias = []
        
        for modelo in modelos_query:
            stock_total = modelo.total_stock
            
            if stock_total <= stock_minimo:
                # Calcular ventas promedio (si hay datos de ventas)
                cantidad_sugerida = max(10, stock_minimo * 2)  # Lógica básica
                
                sugerencias.append({
                    'modelo_id': modelo.id,
                    'modelo_nombre': str(modelo),
                    'proveedor': modelo.proveedor.nombre_completo if modelo.proveedor else 'Sin proveedor',
                    'proveedor_id': modelo.proveedor.id if modelo.proveedor else None,
                    'stock_actual': stock_total,
                    'stock_minimo': stock_minimo,
                    'cantidad_sugerida': cantidad_sugerida,
                    'precio_compra': modelo.precio_compra,
                    'total_estimado': modelo.precio_compra * cantidad_sugerida,
                })
        
        return Response({
            'sugerencias': sugerencias,
            'total_modelos_bajo_stock': len(sugerencias),
            'total_estimado_restock': sum(s['total_estimado'] for s in sugerencias)
        })

class CrearOrdenCompraAutomaticaView(APIView):
    """Vista para crear orden de compra automática basada en sugerencias"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        proveedor_id = request.data.get('proveedor_id')
        sugerencias = request.data.get('sugerencias', [])
        fecha_entrega = request.data.get('fecha_entrega_esperada')
        
        # Validate required fields
        if not proveedor_id:
            return Response(
                {'error': 'proveedor_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not sugerencias or len(sugerencias) == 0:
            return Response(
                {'error': 'sugerencias es requerido y debe contener al menos un elemento'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            proveedor = Proveedor.objects.get(id=proveedor_id)
        except Proveedor.DoesNotExist:
            return Response(
                {'error': f'Proveedor con ID {proveedor_id} no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generar número de orden único
        import uuid
        numero_orden = f"OC-{date.today().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Procesar fecha de entrega
        if fecha_entrega:
            try:
                # Parse the date string (format: YYYY-MM-DD)
                fecha_entrega_date = datetime.strptime(fecha_entrega, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                fecha_entrega_date = date.today() + timedelta(days=15)
        else:
            fecha_entrega_date = date.today() + timedelta(days=15)
        
        # Crear orden
        orden = OrdenCompra.objects.create(
            proveedor=proveedor,
            numero_orden=numero_orden,
            fecha_orden=date.today(),
            fecha_entrega_esperada=fecha_entrega_date,
            estado='borrador',
            prioridad='normal',
            creado_por=request.user,
            notas='Orden generada automáticamente por sugerencias de re-stock'
        )
        
        # Crear detalles
        subtotal = 0
        for i, sugerencia in enumerate(sugerencias):
            # Validate each suggestion
            if not sugerencia.get('modelo_id'):
                return Response(
                    {'error': f'modelo_id es requerido en sugerencia {i+1}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                modelo = MotoModelo.objects.get(id=sugerencia['modelo_id'])
            except MotoModelo.DoesNotExist:
                return Response(
                    {'error': f'Modelo con ID {sugerencia["modelo_id"]} no encontrado en sugerencia {i+1}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            cantidad = sugerencia.get('cantidad', sugerencia.get('cantidad_sugerida', 1))
            if cantidad <= 0:
                return Response(
                    {'error': f'Cantidad debe ser mayor a 0 en sugerencia {i+1}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            precio = modelo.precio_compra or 0
            subtotal_item = precio * cantidad
            
            DetalleOrdenCompra.objects.create(
                orden=orden,
                modelo_moto=modelo,
                color=sugerencia.get('color', 'Varios'),
                cantidad_solicitada=cantidad,
                precio_unitario=precio,
                subtotal=subtotal_item
            )
            
            subtotal += subtotal_item
        
        # Actualizar totales de la orden
        orden.subtotal = subtotal
        orden.total = subtotal  # Sin impuestos por ahora
        orden.save()
        
        serializer = OrdenCompraSerializer(orden)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# ===== VISTAS DE IMPRESIÓN Y PDF =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def imprimir_orden_compra_pdf(request, orden_id):
    """Genera PDF de orden de compra para imprimir"""
    orden = get_object_or_404(OrdenCompra, id=orden_id)
    
    # Crear buffer para el PDF
    buffer = io.BytesIO()
    
    # Crear PDF
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    # Título
    title = Paragraph(f"<para align=center><b>ORDEN DE COMPRA #{orden.numero_orden}</b></para>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    # Información del proveedor
    proveedor_info = f"""
    <para><b>PROVEEDOR:</b><br/>
    {orden.proveedor.nombre_completo}<br/>
    {orden.proveedor.direccion}<br/>
    {orden.proveedor.ciudad}, {orden.proveedor.pais}<br/>
    Tel: {orden.proveedor.telefono_principal}<br/>
    Email: {orden.proveedor.email_principal}
    </para>
    """
    elements.append(Paragraph(proveedor_info, styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Información de la orden
    orden_info = f"""
    <para>
    <b>Fecha de Orden:</b> {orden.fecha_orden}<br/>
    <b>Fecha de Entrega Esperada:</b> {orden.fecha_entrega_esperada}<br/>
    <b>Estado:</b> {orden.get_estado_display()}<br/>
    <b>Prioridad:</b> {orden.get_prioridad_display()}
    </para>
    """
    elements.append(Paragraph(orden_info, styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Tabla de productos
    data = [['Producto', 'Color', 'Cantidad', 'Precio Unit.', 'Subtotal']]
    
    for detalle in orden.detalles.all():
        data.append([
            str(detalle.modelo_moto),
            detalle.color,
            detalle.cantidad_solicitada,
            f"${detalle.precio_unitario:,.2f}",
            f"${detalle.subtotal:,.2f}"
        ])
    
    # Totales
    data.append(['', '', '', 'TOTAL:', f"${orden.total:,.2f}"])
    
    # Crear tabla
    table = Table(data, colWidths=[3*inch, 1*inch, 0.8*inch, 1*inch, 1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 20))
    
    # Notas
    if orden.notas:
        elements.append(Paragraph(f"<b>Notas:</b> {orden.notas}", styles['Normal']))
    
    # Condiciones especiales
    if orden.condiciones_especiales:
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"<b>Condiciones Especiales:</b> {orden.condiciones_especiales}", styles['Normal']))
    
    # Firmas
    elements.append(Spacer(1, 40))
    firmas = """
    <para>
    _____________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _____________________<br/>
    Firma Autorizada &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Recibido Por
    </para>
    """
    elements.append(Paragraph(firmas, styles['Normal']))
    
    # Construir PDF
    doc.build(elements)
    
    # Preparar respuesta
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="orden_compra_{orden.numero_orden}.pdf"'
    
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def imprimir_factura_proveedor_pdf(request, factura_id):
    """Genera PDF de factura de proveedor"""
    factura = get_object_or_404(FacturaProveedor, id=factura_id)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    # Título
    title = Paragraph(f"<para align=center><b>FACTURA #{factura.numero_factura}</b></para>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    # Información básica
    info = f"""
    <para>
    <b>Proveedor:</b> {factura.proveedor.nombre_completo}<br/>
    <b>Fecha de Emisión:</b> {factura.fecha_emision}<br/>
    <b>Fecha de Vencimiento:</b> {factura.fecha_vencimiento}<br/>
    <b>Estado:</b> {factura.get_estado_display()}<br/>
    <b>Tipo:</b> {factura.get_tipo_factura_display()}
    </para>
    """
    elements.append(Paragraph(info, styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Descripción
    if factura.descripcion:
        elements.append(Paragraph(f"<b>Descripción:</b><br/>{factura.descripcion}", styles['Normal']))
        elements.append(Spacer(1, 12))
    
    # Totales
    totales_data = [
        ['Subtotal:', f"${factura.subtotal:,.2f}"],
        ['Descuento:', f"${factura.descuento:,.2f}"],
        ['Impuestos:', f"${factura.impuestos:,.2f}"],
        ['TOTAL:', f"${factura.total:,.2f}"]
    ]
    
    totales_table = Table(totales_data, colWidths=[2*inch, 1.5*inch])
    totales_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
    ]))
    
    elements.append(totales_table)
    
    # Construir PDF
    doc.build(elements)
    
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="factura_{factura.numero_factura}.pdf"'
    
    return response