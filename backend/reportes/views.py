from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q, F, DecimalField
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from django.http import HttpResponse
import json
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from io import BytesIO

from ventas.models import Venta, VentaDetalle
from motos.models import MotoModelo, MotoInventario, Moto
from pagos.models import Pago
from usuarios.models import Usuario


class ReporteVentasPeriodoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        periodo = request.query_params.get('periodo', 'mensual')
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        try:
            if fecha_inicio:
                fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            else:
                fecha_inicio = timezone.now().date() - timedelta(days=30)
                
            if fecha_fin:
                fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
            else:
                fecha_fin = timezone.now().date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        ventas_query = Venta.objects.filter(
            fecha_venta__date__range=[fecha_inicio, fecha_fin]
        )
        
        # Seleccionar función de truncado según período
        if periodo == 'diario':
            trunc_func = TruncDay('fecha_venta')
        elif periodo == 'semanal':
            trunc_func = TruncWeek('fecha_venta')
        elif periodo == 'anual':
            trunc_func = TruncYear('fecha_venta')
        else:  # mensual por defecto
            trunc_func = TruncMonth('fecha_venta')
        
        # Ventas por período
        ventas_periodo = ventas_query.annotate(
            periodo_fecha=trunc_func
        ).values('periodo_fecha').annotate(
            total_ventas=Count('id'),
            total_ingresos=Sum('monto_total')
        ).order_by('periodo_fecha')
        
        # Top productos vendidos
        top_productos = VentaDetalle.objects.filter(
            venta__fecha_venta__date__range=[fecha_inicio, fecha_fin]
        ).values(
            'moto__marca',
            'moto__modelo'
        ).annotate(
            total_vendidos=Sum('cantidad'),
            total_ingresos=Sum(F('cantidad') * F('precio_unitario'))
        ).order_by('-total_vendidos')[:10]
        
        # Rendimiento por vendedor
        rendimiento_vendedores = ventas_query.values(
            'usuario__first_name',
            'usuario__last_name'
        ).annotate(
            total_ventas=Count('id'),
            total_ingresos=Sum('monto_total'),
            promedio_venta=Avg('monto_total')
        ).order_by('-total_ingresos')
        
        # Estadísticas generales
        stats_generales = ventas_query.aggregate(
            total_ventas=Count('id'),
            total_ingresos=Sum('monto_total'),
            promedio_venta=Avg('monto_total')
        )
        
        return Response({
            'periodo': periodo,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'ventas_por_periodo': list(ventas_periodo),
            'top_productos': list(top_productos),
            'rendimiento_vendedores': list(rendimiento_vendedores),
            'estadisticas_generales': stats_generales
        })
    
    def post(self, request):
        """Generar reporte de ventas en PDF"""
        # Obtener los mismos datos que en GET
        response_data = self.get(request).data
        
        # Crear PDF con ReportLab
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Título del reporte
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e40af'),
            alignment=1,  # Centrado
            spaceAfter=30
        )
        story.append(Paragraph("Inversiones C&C - Reporte de Ventas", title_style))
        story.append(Spacer(1, 20))
        
        # Estadísticas generales
        stats = response_data.get('estadisticas_generales', {})
        data = [
            ['Métrica', 'Valor'],
            ['Total Ventas', str(stats.get('total_ventas', 0))],
            ['Ingresos Totales', f"${stats.get('total_ingresos', 0):,.0f}"],
            ['Promedio por Venta', f"${stats.get('promedio_venta', 0):,.0f}"],
        ]
        
        table = Table(data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 30))
        
        # Top productos si existen
        if response_data.get('top_productos'):
            story.append(Paragraph("Top Productos Vendidos", styles['Heading2']))
            story.append(Spacer(1, 10))
            
            productos_data = [['Marca', 'Modelo', 'Unidades', 'Ingresos']]
            for producto in response_data['top_productos'][:5]:
                productos_data.append([
                    str(producto.get('moto__marca', '')),
                    str(producto.get('moto__modelo', '')),
                    str(producto.get('total_vendidos', 0)),
                    f"${producto.get('total_ingresos', 0):,.0f}"
                ])
            
            productos_table = Table(productos_data, colWidths=[1.5*inch, 1.5*inch, 1*inch, 1.5*inch])
            productos_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(productos_table)
        
        # Construir el PDF
        doc.build(story)
        buffer.seek(0)
        
        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="reporte_ventas_{response_data["fecha_inicio"]}_{response_data["fecha_fin"]}.pdf"'
        
        return response


class ReporteInventarioView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        incluir_inactivos = request.query_params.get('incluir_inactivos', 'false').lower() == 'true'
        stock_critico = int(request.query_params.get('stock_critico', 5))
        
        # Filtro base
        queryset = MotoInventario.objects.select_related('modelo')
        if not incluir_inactivos:
            queryset = queryset.filter(modelo__activa=True)
        
        # Stock actual por producto
        inventario_actual = queryset.annotate(
            valor_total=F('cantidad_stock') * F('modelo__precio_compra'),
            valor_venta_total=F('cantidad_stock') * F('modelo__precio_venta')
        ).values(
            'modelo__marca',
            'modelo__modelo',
            'color',
            'cantidad_stock',
            'modelo__precio_compra',
            'modelo__precio_venta',
            'fecha_ingreso'
        ).annotate(
            valor_inventario=Sum('valor_total'),
            valor_venta_potencial=Sum('valor_venta_total')
        )
        
        # Productos con stock crítico
        stock_critico_productos = queryset.filter(
            cantidad_stock__lte=stock_critico
        ).values(
            'modelo__marca',
            'modelo__modelo',
            'color',
            'cantidad_stock'
        )
        
        # Valoración total del inventario
        valoracion_total = queryset.aggregate(
            valor_total_compra=Sum(F('cantidad_stock') * F('modelo__precio_compra')),
            valor_total_venta=Sum(F('cantidad_stock') * F('modelo__precio_venta')),
            total_unidades=Sum('cantidad_stock'),
            total_productos=Count('modelo', distinct=True)
        )
        
        # Análisis de rotación (últimos 3 meses)
        fecha_limite = timezone.now().date() - timedelta(days=90)
        rotacion_inventario = VentaDetalle.objects.filter(
            venta__fecha_venta__date__gte=fecha_limite
        ).values(
            'moto__marca',
            'moto__modelo'
        ).annotate(
            unidades_vendidas=Sum('cantidad'),
            ingresos_generados=Sum(F('cantidad') * F('precio_unitario'))
        ).order_by('-unidades_vendidas')
        
        # Productos sin movimiento
        productos_vendidos_ids = VentaDetalle.objects.filter(
            venta__fecha_venta__date__gte=fecha_limite
        ).values_list('moto_id', flat=True).distinct()
        
        productos_sin_movimiento = Moto.objects.exclude(
            id__in=productos_vendidos_ids
        ).filter(activa=True).values(
            'marca',
            'modelo',
            'precio_compra',
            'precio_venta'
        )
        
        return Response({
            'inventario_actual': list(inventario_actual),
            'stock_critico': list(stock_critico_productos),
            'valoracion_total': valoracion_total,
            'rotacion_inventario': list(rotacion_inventario),
            'productos_sin_movimiento': list(productos_sin_movimiento),
            'parametros': {
                'stock_critico_limite': stock_critico,
                'incluir_inactivos': incluir_inactivos
            }
        })
    
    def post(self, request):
        """Generar reporte de inventario en PDF"""
        # Obtener los mismos datos que en GET
        response_data = self.get(request).data
        
        # Crear PDF con ReportLab
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Título del reporte
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e40af'),
            alignment=1,
            spaceAfter=30
        )
        story.append(Paragraph("Inversiones C&C - Reporte de Inventario", title_style))
        story.append(Spacer(1, 20))
        
        # Valoración total
        valoracion = response_data.get('valoracion_total', {})
        data = [
            ['Métrica', 'Valor'],
            ['Total Unidades', str(valoracion.get('total_unidades', 0))],
            ['Valor Inventario (Compra)', f"${valoracion.get('valor_total_compra', 0):,.0f}"],
            ['Valor Potencial (Venta)', f"${valoracion.get('valor_total_venta', 0):,.0f}"],
        ]
        
        table = Table(data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 30))
        
        # Stock crítico si existe
        if response_data.get('stock_critico'):
            story.append(Paragraph("⚠️ Productos con Stock Crítico", styles['Heading2']))
            story.append(Spacer(1, 10))
            
            critico_data = [['Marca', 'Modelo', 'Color', 'Stock Actual']]
            for item in response_data['stock_critico'][:10]:
                critico_data.append([
                    str(item.get('modelo__marca', '')),
                    str(item.get('modelo__modelo', '')),
                    str(item.get('color', '')),
                    str(item.get('cantidad_stock', 0))
                ])
            
            critico_table = Table(critico_data, colWidths=[1.5*inch, 1.5*inch, 1*inch, 1*inch])
            critico_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fee2e2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(critico_table)
        
        # Construir el PDF
        doc.build(story)
        buffer.seek(0)
        
        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_inventario.pdf"'
        
        return response


class ReporteCobranzaView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        try:
            if fecha_inicio:
                fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            else:
                fecha_inicio = timezone.now().date() - timedelta(days=30)
                
            if fecha_fin:
                fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
            else:
                fecha_fin = timezone.now().date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Ventas en el período
        ventas_periodo = Venta.objects.filter(
            fecha_venta__date__range=[fecha_inicio, fecha_fin]
        )
        
        # Cuentas por cobrar (ventas no pagadas completamente)
        cuentas_por_cobrar = []
        for venta in ventas_periodo:
            total_pagado = venta.pagos.aggregate(
                total=Sum('monto_pagado')
            )['total'] or Decimal('0')
            
            saldo_pendiente = venta.monto_total - total_pagado
            
            if saldo_pendiente > 0:
                dias_vencimiento = (timezone.now().date() - venta.fecha_venta.date()).days
                
                cuentas_por_cobrar.append({
                    'venta_id': venta.id,
                    'cliente_nombre': f"{venta.cliente.nombre} {venta.cliente.apellido}",
                    'cliente_documento': venta.cliente.cedula,
                    'fecha_venta': venta.fecha_venta.date(),
                    'total_venta': venta.monto_total,
                    'total_pagado': total_pagado,
                    'saldo_pendiente': saldo_pendiente,
                    'dias_vencimiento': dias_vencimiento,
                    'estado_morosidad': 'Al día' if dias_vencimiento <= 30 else 'Moroso' if dias_vencimiento <= 60 else 'Crítico'
                })
        
        # Historial de pagos
        historial_pagos = Pago.objects.filter(
            fecha_pago__date__range=[fecha_inicio, fecha_fin]
        ).select_related('venta', 'venta__cliente').values(
            'venta__id',
            'venta__cliente__nombre',
            'venta__cliente__apellido',
            'monto_pagado',
            'fecha_pago',
            'tipo_pago',
            'observaciones'
        ).order_by('-fecha_pago')
        
        # Análisis de morosidad
        total_por_cobrar = sum(cuenta['saldo_pendiente'] for cuenta in cuentas_por_cobrar)
        cuentas_al_dia = [c for c in cuentas_por_cobrar if c['dias_vencimiento'] <= 30]
        cuentas_morosas = [c for c in cuentas_por_cobrar if 30 < c['dias_vencimiento'] <= 60]
        cuentas_criticas = [c for c in cuentas_por_cobrar if c['dias_vencimiento'] > 60]
        
        analisis_morosidad = {
            'total_cuentas': len(cuentas_por_cobrar),
            'total_por_cobrar': total_por_cobrar,
            'cuentas_al_dia': {
                'cantidad': len(cuentas_al_dia),
                'monto': sum(c['saldo_pendiente'] for c in cuentas_al_dia)
            },
            'cuentas_morosas': {
                'cantidad': len(cuentas_morosas),
                'monto': sum(c['saldo_pendiente'] for c in cuentas_morosas)
            },
            'cuentas_criticas': {
                'cantidad': len(cuentas_criticas),
                'monto': sum(c['saldo_pendiente'] for c in cuentas_criticas)
            }
        }
        
        # Estadísticas de pagos
        stats_pagos = Pago.objects.filter(
            fecha_pago__date__range=[fecha_inicio, fecha_fin]
        ).aggregate(
            total_pagos=Count('id'),
            total_recaudado=Sum('monto_pagado'),
            promedio_pago=Avg('monto_pagado')
        )
        
        return Response({
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'cuentas_por_cobrar': cuentas_por_cobrar,
            'historial_pagos': list(historial_pagos),
            'analisis_morosidad': analisis_morosidad,
            'estadisticas_pagos': stats_pagos
        })
    
    def post(self, request):
        """Generar reporte de cobranza en PDF"""
        # Obtener los mismos datos que en GET
        response_data = self.get(request).data
        
        # Crear PDF con ReportLab
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Título del reporte
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e40af'),
            alignment=1,
            spaceAfter=30
        )
        story.append(Paragraph("Inversiones C&C - Reporte de Cobranza", title_style))
        story.append(Spacer(1, 20))
        
        # Análisis de morosidad
        analisis = response_data.get('analisis_morosidad', {})
        data = [
            ['Métrica', 'Valor'],
            ['Total Cuentas por Cobrar', str(analisis.get('total_cuentas', 0))],
            ['Monto Total por Cobrar', f"${analisis.get('total_por_cobrar', 0):,.0f}"],
            ['Cuentas al Día', str(analisis.get('cuentas_al_dia', {}).get('cantidad', 0))],
            ['Cuentas Críticas', str(analisis.get('cuentas_criticas', {}).get('cantidad', 0))],
        ]
        
        table = Table(data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 30))
        
        # Estadísticas de pagos
        stats_pagos = response_data.get('estadisticas_pagos', {})
        story.append(Paragraph("Estadísticas de Pagos", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        pagos_data = [
            ['Métrica', 'Valor'],
            ['Total Pagos Recibidos', str(stats_pagos.get('total_pagos', 0))],
            ['Monto Total Recaudado', f"${stats_pagos.get('total_recaudado', 0):,.0f}"],
            ['Promedio por Pago', f"${stats_pagos.get('promedio_pago', 0):,.0f}"],
        ]
        
        pagos_table = Table(pagos_data, colWidths=[3*inch, 2*inch])
        pagos_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(pagos_table)
        
        # Construir el PDF
        doc.build(story)
        buffer.seek(0)
        
        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="reporte_cobranza_{response_data["fecha_inicio"]}_{response_data["fecha_fin"]}.pdf"'
        
        return response


class ReporteFinancieroView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        try:
            if fecha_inicio:
                fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            else:
                fecha_inicio = timezone.now().date() - timedelta(days=30)
                
            if fecha_fin:
                fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
            else:
                fecha_fin = timezone.now().date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Ingresos por ventas
        ventas_stats = Venta.objects.filter(
            fecha_venta__date__range=[fecha_inicio, fecha_fin]
        ).aggregate(
            total_ingresos=Sum('monto_total'),
            total_ventas=Count('id')
        )
        
        # Ingresos por pagos efectivamente recibidos
        pagos_stats = Pago.objects.filter(
            fecha_pago__date__range=[fecha_inicio, fecha_fin]
        ).aggregate(
            total_recaudado=Sum('monto_pagado'),
            total_pagos=Count('id')
        )
        
        # Análisis por método de pago
        pagos_por_metodo = Pago.objects.filter(
            fecha_pago__date__range=[fecha_inicio, fecha_fin]
        ).values('tipo_pago').annotate(
            total=Sum('monto_pagado'),
            cantidad=Count('id')
        ).order_by('-total')
        
        # Flujo de caja diario
        flujo_caja = Pago.objects.filter(
            fecha_pago__date__range=[fecha_inicio, fecha_fin]
        ).annotate(
            fecha=TruncDay('fecha_pago')
        ).values('fecha').annotate(
            ingresos_dia=Sum('monto_pagado'),
            pagos_dia=Count('id')
        ).order_by('fecha')
        
        # Análisis de rentabilidad por producto
        rentabilidad_productos = VentaDetalle.objects.filter(
            venta__fecha_venta__date__range=[fecha_inicio, fecha_fin]
        ).values(
            'moto__marca',
            'moto__modelo'
        ).annotate(
            unidades_vendidas=Sum('cantidad'),
            ingresos_totales=Sum(F('cantidad') * F('precio_unitario')),
            costo_total=Sum(F('cantidad') * F('moto__precio_compra')),
            ganancia_total=Sum(
                F('cantidad') * (F('precio_unitario') - F('moto__precio_compra')),
                output_field=DecimalField()
            )
        ).annotate(
            margen_porcentaje=F('ganancia_total') * 100 / F('ingresos_totales')
        ).order_by('-ganancia_total')
        
        # Resumen financiero
        total_inventario = MotoInventario.objects.aggregate(
            valor_inventario=Sum(F('cantidad_stock') * F('modelo__precio_compra'))
        )['valor_inventario'] or Decimal('0')
        
        # Cuentas por cobrar totales
        cuentas_por_cobrar_total = Decimal('0')
        for venta in Venta.objects.all():
            total_pagado = venta.pagos.aggregate(total=Sum('monto_pagado'))['total'] or Decimal('0')
            saldo_pendiente = venta.monto_total - total_pagado
            if saldo_pendiente > 0:
                cuentas_por_cobrar_total += saldo_pendiente
        
        resumen_financiero = {
            'activos': {
                'efectivo_recaudado': pagos_stats['total_recaudado'] or Decimal('0'),
                'cuentas_por_cobrar': cuentas_por_cobrar_total,
                'valor_inventario': total_inventario,
                'total_activos': (pagos_stats['total_recaudado'] or Decimal('0')) + cuentas_por_cobrar_total + total_inventario
            },
            'ingresos': {
                'ventas_brutas': ventas_stats['total_ingresos'] or Decimal('0'),
                'total_ventas': ventas_stats['total_ventas'] or 0
            }
        }
        
        return Response({
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'ventas_estadisticas': ventas_stats,
            'pagos_estadisticas': pagos_stats,
            'pagos_por_metodo': list(pagos_por_metodo),
            'flujo_caja_diario': list(flujo_caja),
            'rentabilidad_productos': list(rentabilidad_productos),
            'resumen_financiero': resumen_financiero
        })
    
    def post(self, request):
        """Generar reporte financiero en PDF"""
        # Obtener los mismos datos que en GET
        response_data = self.get(request).data
        
        # Crear PDF con ReportLab
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Título del reporte
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e40af'),
            alignment=1,
            spaceAfter=30
        )
        story.append(Paragraph("Inversiones C&C - Estados Financieros", title_style))
        story.append(Spacer(1, 20))
        
        # Resumen ejecutivo
        ventas_stats = response_data.get('ventas_estadisticas', {})
        pagos_stats = response_data.get('pagos_estadisticas', {})
        resumen = response_data.get('resumen_financiero', {})
        
        data = [
            ['Métrica', 'Valor'],
            ['Ventas Realizadas', str(ventas_stats.get('total_ventas', 0))],
            ['Ingresos por Ventas', f"${ventas_stats.get('total_ingresos', 0):,.0f}"],
            ['Efectivo Recaudado', f"${pagos_stats.get('total_recaudado', 0):,.0f}"],
            ['Pagos Procesados', str(pagos_stats.get('total_pagos', 0))],
        ]
        
        table = Table(data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 30))
        
        # Balance general simplificado
        activos = resumen.get('activos', {})
        story.append(Paragraph("Balance General Simplificado", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        balance_data = [
            ['Concepto', 'Monto'],
            ['ACTIVOS', ''],
            ['Efectivo Recaudado', f"${activos.get('efectivo_recaudado', 0):,.0f}"],
            ['Cuentas por Cobrar', f"${activos.get('cuentas_por_cobrar', 0):,.0f}"],
            ['Valor del Inventario', f"${activos.get('valor_inventario', 0):,.0f}"],
            ['TOTAL ACTIVOS', f"${activos.get('total_activos', 0):,.0f}"],
        ]
        
        balance_table = Table(balance_data, colWidths=[3*inch, 2*inch])
        balance_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (0, 1), 'Helvetica-Bold'),
            ('FONTNAME', (0, 5), (-1, 5), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('LINEABOVE', (0, 5), (-1, 5), 2, colors.black)
        ]))
        
        story.append(balance_table)
        
        # Construir el PDF
        doc.build(story)
        buffer.seek(0)
        
        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="reporte_financiero_{response_data["fecha_inicio"]}_{response_data["fecha_fin"]}.pdf"'
        
        return response
