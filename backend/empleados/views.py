from django.shortcuts import render
from django.db.models import Count, Avg, Sum, Q, F
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date, timedelta, datetime
import calendar

from .models import (
    Departamento, Posicion, Empleado, SolicitudTiempo, 
    RegistroAsistencia, Nomina, DocumentoEmpleado, EvaluacionDesempeno
)
from .serializers import (
    DepartamentoSerializer, PosicionSerializer, EmpleadoSerializer, EmpleadoListSerializer,
    SolicitudTiempoSerializer, RegistroAsistenciaSerializer, RegistroAsistenciaCreateSerializer,
    NominaSerializer, DocumentoEmpleadoSerializer, EvaluacionDesempenoSerializer,
    EmpleadoStatsSerializer, DepartamentoStatsSerializer, AsistenciaReporteSerializer,
    ResumenAsistenciaDiariaSerializer, AsistenciaStatsSerializer, RegistroMasivoAsistenciaSerializer
)


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']


class PosicionViewSet(viewsets.ModelViewSet):
    queryset = Posicion.objects.select_related('departamento')
    serializer_class = PosicionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['departamento', 'activa']
    search_fields = ['titulo', 'descripcion', 'departamento__nombre']
    ordering_fields = ['titulo', 'departamento__nombre', 'fecha_creacion']
    ordering = ['departamento__nombre', 'titulo']


class EmpleadoViewSet(viewsets.ModelViewSet):
    queryset = Empleado.objects.select_related('posicion', 'posicion__departamento', 'supervisor')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'posicion', 'posicion__departamento', 'tipo_contrato']
    search_fields = ['nombres', 'apellidos', 'numero_empleado', 'cedula', 'email']
    ordering_fields = ['nombres', 'apellidos', 'fecha_ingreso', 'salario_base']
    ordering = ['apellidos', 'nombres']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmpleadoListSerializer
        return EmpleadoSerializer
    
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas generales de empleados"""
        today = date.today()
        first_day_month = date(today.year, today.month, 1)
        
        total_empleados = Empleado.objects.count()
        empleados_activos = Empleado.objects.filter(estado='activo').count()
        empleados_inactivos = total_empleados - empleados_activos
        empleados_nuevos_mes = Empleado.objects.filter(fecha_ingreso__gte=first_day_month).count()
        
        # Promedio de antigüedad - calcular manualmente
        empleados_con_fecha = Empleado.objects.exclude(fecha_ingreso__isnull=True)
        if empleados_con_fecha.exists():
            total_dias = 0
            count = 0
            for empleado in empleados_con_fecha:
                dias_antiguedad = (today - empleado.fecha_ingreso).days
                total_dias += dias_antiguedad
                count += 1
            promedio_antiguedad = (total_dias / count / 365) if count > 0 else 0
        else:
            promedio_antiguedad = 0
        
        total_departamentos = Departamento.objects.filter(activo=True).count()
        
        # Gasto de nómina del mes actual
        gasto_nomina_mes = Nomina.objects.filter(
            año=today.year, 
            mes=today.month,
            estado__in=['aprobada', 'pagada']
        ).aggregate(total=Sum('salario_neto'))['total'] or 0
        
        stats = {
            'total_empleados': total_empleados,
            'empleados_activos': empleados_activos,
            'empleados_inactivos': empleados_inactivos,
            'empleados_nuevos_mes': empleados_nuevos_mes,
            'promedio_antiguedad': round(promedio_antiguedad, 1),
            'total_departamentos': total_departamentos,
            'gasto_nomina_mes': gasto_nomina_mes
        }
        
        serializer = EmpleadoStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_departamento(self, request):
        """Estadísticas de empleados por departamento"""
        departamentos_stats = Departamento.objects.annotate(
            total_empleados=Count('posiciones__empleado', filter=Q(posiciones__empleado__estado='activo')),
            promedio_salario=Avg('posiciones__empleado__salario_base', filter=Q(posiciones__empleado__estado='activo')),
            gasto_total=Sum('posiciones__empleado__salario_base', filter=Q(posiciones__empleado__estado='activo'))
        ).filter(activo=True, total_empleados__gt=0)
        
        stats_data = []
        for dept in departamentos_stats:
            stats_data.append({
                'departamento': dept.nombre,
                'total_empleados': dept.total_empleados,
                'promedio_salario': dept.promedio_salario or 0,
                'gasto_total': dept.gasto_total or 0
            })
        
        serializer = DepartamentoStatsSerializer(stats_data, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def historial_nominas(self, request, pk=None):
        """Historial de nóminas de un empleado"""
        empleado = self.get_object()
        nominas = Nomina.objects.filter(empleado=empleado).order_by('-año', '-mes')
        serializer = NominaSerializer(nominas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def solicitudes_tiempo(self, request, pk=None):
        """Solicitudes de tiempo de un empleado"""
        empleado = self.get_object()
        solicitudes = SolicitudTiempo.objects.filter(empleado=empleado).order_by('-fecha_solicitud')
        serializer = SolicitudTiempoSerializer(solicitudes, many=True)
        return Response(serializer.data)


class SolicitudTiempoViewSet(viewsets.ModelViewSet):
    queryset = SolicitudTiempo.objects.select_related('empleado', 'aprobada_por')
    serializer_class = SolicitudTiempoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['empleado', 'tipo', 'estado']
    search_fields = ['empleado__nombres', 'empleado__apellidos', 'motivo']
    ordering_fields = ['fecha_solicitud', 'fecha_inicio', 'fecha_fin']
    ordering = ['-fecha_solicitud']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Handle year and month filtering manually
        year = self.request.query_params.get('fecha_inicio__year')
        month = self.request.query_params.get('fecha_inicio__month')

        if year:
            queryset = queryset.filter(fecha_inicio__year=year)
        if month:
            queryset = queryset.filter(fecha_inicio__month=month)

        return queryset
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar una solicitud de tiempo"""
        solicitud = self.get_object()
        comentarios = request.data.get('comentarios', '')
        
        if solicitud.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden aprobar solicitudes pendientes'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        solicitud.estado = 'aprobada'
        solicitud.aprobada_por = request.user
        solicitud.fecha_aprobacion = timezone.now()
        solicitud.comentarios_aprobacion = comentarios
        solicitud.save()
        
        serializer = self.get_serializer(solicitud)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una solicitud de tiempo"""
        solicitud = self.get_object()
        comentarios = request.data.get('comentarios', '')
        
        if solicitud.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden rechazar solicitudes pendientes'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        solicitud.estado = 'rechazada'
        solicitud.aprobada_por = request.user
        solicitud.fecha_aprobacion = timezone.now()
        solicitud.comentarios_aprobacion = comentarios
        solicitud.save()
        
        serializer = self.get_serializer(solicitud)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Solicitudes pendientes de aprobación"""
        pendientes = self.get_queryset().filter(estado='pendiente')
        serializer = self.get_serializer(pendientes, many=True)
        return Response(serializer.data)


class RegistroAsistenciaViewSet(viewsets.ModelViewSet):
    queryset = RegistroAsistencia.objects.select_related('empleado')
    serializer_class = RegistroAsistenciaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['empleado', 'fecha', 'tipo']
    search_fields = ['empleado__nombres', 'empleado__apellidos', 'empleado__numero_empleado']
    ordering_fields = ['fecha', 'hora']
    ordering = ['-fecha', '-hora']

    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'registro_masivo':
            return RegistroAsistenciaCreateSerializer
        return RegistroAsistenciaSerializer

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)

    @action(detail=False, methods=['post'])
    def registro_masivo(self, request):
        """Crear múltiples registros de asistencia"""
        serializer = RegistroMasivoAsistenciaSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            result = serializer.create(serializer.validated_data)
            return Response({
                'message': f'{len(result["registros_creados"])} registros creados exitosamente',
                'registros_creados': len(result["registros_creados"])
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def resumen_diario(self, request):
        """Resumen de asistencia diaria"""
        fecha_str = request.query_params.get('fecha', str(date.today()))
        departamento = request.query_params.get('departamento')

        try:
            fecha_consulta = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filtrar empleados activos
        empleados_query = Empleado.objects.filter(estado='activo')
        if departamento:
            empleados_query = empleados_query.filter(posicion__departamento_id=departamento)

        resumen_data = []

        for empleado in empleados_query:
            registros = RegistroAsistencia.objects.filter(
                empleado=empleado,
                fecha=fecha_consulta
            ).order_by('hora')

            entrada = registros.filter(tipo='entrada').first()
            salida = registros.filter(tipo='salida').first()
            entrada_almuerzo = registros.filter(tipo='entrada_almuerzo').first()
            salida_almuerzo = registros.filter(tipo='salida_almuerzo').first()

            # Calcular estado y horas trabajadas
            estado = 'ausente'
            horas_trabajadas = None

            if entrada:
                if salida:
                    estado = 'presente'
                    # Calcular horas trabajadas (básico)
                    inicio = datetime.combine(fecha_consulta, entrada.hora)
                    fin = datetime.combine(fecha_consulta, salida.hora)

                    # Restar tiempo de almuerzo si existe
                    if entrada_almuerzo and salida_almuerzo:
                        almuerzo_inicio = datetime.combine(fecha_consulta, salida_almuerzo.hora)
                        almuerzo_fin = datetime.combine(fecha_consulta, entrada_almuerzo.hora)
                        tiempo_almuerzo = almuerzo_fin - almuerzo_inicio
                        horas_trabajadas = (fin - inicio - tiempo_almuerzo).total_seconds() / 3600
                    else:
                        # Asumir 1 hora de almuerzo
                        horas_trabajadas = (fin - inicio).total_seconds() / 3600 - 1

                    # Verificar si llegó tarde (después de las 8:00 AM)
                    hora_entrada_limite = datetime.strptime('08:00', '%H:%M').time()
                    if entrada.hora > hora_entrada_limite:
                        estado = 'tarde'
                else:
                    estado = 'parcial'

            resumen_data.append({
                'fecha': fecha_consulta,
                'empleado_id': empleado.id,
                'empleado_nombre': empleado.nombre_completo,
                'empleado_numero': empleado.numero_empleado,
                'entrada': entrada.hora if entrada else None,
                'salida': salida.hora if salida else None,
                'entrada_almuerzo': entrada_almuerzo.hora if entrada_almuerzo else None,
                'salida_almuerzo': salida_almuerzo.hora if salida_almuerzo else None,
                'horas_trabajadas': round(horas_trabajadas, 2) if horas_trabajadas else None,
                'estado': estado
            })

        serializer = ResumenAsistenciaDiariaSerializer(resumen_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas_diarias(self, request):
        """Estadísticas de asistencia del día"""
        fecha_str = request.query_params.get('fecha', str(date.today()))

        try:
            fecha_consulta = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_empleados = Empleado.objects.filter(estado='activo').count()

        # Empleados con al menos un registro en el día
        empleados_con_registro = RegistroAsistencia.objects.filter(
            fecha=fecha_consulta
        ).values('empleado').distinct().count()

        # Empleados presentes (con entrada y salida)
        empleados_con_entrada = set(RegistroAsistencia.objects.filter(
            fecha=fecha_consulta,
            tipo='entrada'
        ).values_list('empleado', flat=True).distinct())

        empleados_con_salida = set(RegistroAsistencia.objects.filter(
            fecha=fecha_consulta,
            tipo='salida'
        ).values_list('empleado', flat=True).distinct())

        empleados_presentes = len(empleados_con_entrada.intersection(empleados_con_salida))
        empleados_ausentes = total_empleados - empleados_con_registro

        # Empleados que llegaron tarde (después de las 8:00 AM)
        hora_limite = datetime.strptime('08:00', '%H:%M').time()
        empleados_tardios = RegistroAsistencia.objects.filter(
            fecha=fecha_consulta,
            tipo='entrada',
            hora__gt=hora_limite
        ).values('empleado').distinct().count()

        porcentaje_asistencia = (empleados_con_registro / total_empleados * 100) if total_empleados > 0 else 0

        # Hora promedio de entrada
        entradas = RegistroAsistencia.objects.filter(
            fecha=fecha_consulta,
            tipo='entrada'
        ).values_list('hora', flat=True)

        hora_promedio_entrada = None
        if entradas:
            total_segundos = sum((datetime.combine(date.today(), hora) - datetime.combine(date.today(), datetime.min.time())).total_seconds() for hora in entradas)
            promedio_segundos = total_segundos / len(entradas)
            hora_promedio_entrada = (datetime.min + timedelta(seconds=promedio_segundos)).time()

        stats = {
            'total_empleados': total_empleados,
            'empleados_presentes': empleados_con_registro,
            'empleados_ausentes': empleados_ausentes,
            'empleados_tardios': empleados_tardios,
            'porcentaje_asistencia': round(porcentaje_asistencia, 1),
            'hora_promedio_entrada': hora_promedio_entrada
        }

        serializer = AsistenciaStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas_empleado(self, request):
        """Estadísticas detalladas de asistencia por empleado"""
        empleado_id = request.query_params.get('empleado_id')
        mes = request.query_params.get('mes', str(date.today().month))
        anio = request.query_params.get('anio', str(date.today().year))

        if not empleado_id:
            return Response(
                {'error': 'empleado_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            empleado = Empleado.objects.get(id=empleado_id)
            mes = int(mes)
            anio = int(anio)
        except (Empleado.DoesNotExist, ValueError):
            return Response(
                {'error': 'Empleado no encontrado o parámetros inválidos'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obtener rango de fechas del mes
        primer_dia = date(anio, mes, 1)
        if mes == 12:
            ultimo_dia = date(anio + 1, 1, 1) - timedelta(days=1)
        else:
            ultimo_dia = date(anio, mes + 1, 1) - timedelta(days=1)

        # Registros del empleado en el mes
        registros = RegistroAsistencia.objects.filter(
            empleado=empleado,
            fecha__range=[primer_dia, ultimo_dia]
        ).order_by('fecha', 'hora')

        # Estadísticas generales
        dias_trabajados = registros.values('fecha').distinct().count()
        dias_laborables = self._calcular_dias_laborables(primer_dia, ultimo_dia)

        # Días por estado
        dias_presentes = 0
        dias_tardios = 0
        dias_ausentes = 0
        total_horas_trabajadas = 0

        # Analizar cada día laboral
        fecha_actual = primer_dia
        while fecha_actual <= ultimo_dia:
            if fecha_actual.weekday() < 5:  # Lunes a viernes
                registros_dia = registros.filter(fecha=fecha_actual)

                if registros_dia.exists():
                    entrada = registros_dia.filter(tipo='entrada').first()
                    salida = registros_dia.filter(tipo='salida').first()

                    if entrada and salida:
                        dias_presentes += 1

                        # Verificar si llegó tarde
                        hora_limite = datetime.strptime('08:00', '%H:%M').time()
                        if entrada.hora > hora_limite:
                            dias_tardios += 1

                        # Calcular horas trabajadas
                        inicio = datetime.combine(fecha_actual, entrada.hora)
                        fin = datetime.combine(fecha_actual, salida.hora)

                        entrada_almuerzo = registros_dia.filter(tipo='entrada_almuerzo').first()
                        salida_almuerzo = registros_dia.filter(tipo='salida_almuerzo').first()

                        if entrada_almuerzo and salida_almuerzo:
                            almuerzo_inicio = datetime.combine(fecha_actual, salida_almuerzo.hora)
                            almuerzo_fin = datetime.combine(fecha_actual, entrada_almuerzo.hora)
                            tiempo_almuerzo = almuerzo_fin - almuerzo_inicio
                            horas_trabajadas = (fin - inicio - tiempo_almuerzo).total_seconds() / 3600
                        else:
                            horas_trabajadas = (fin - inicio).total_seconds() / 3600 - 1

                        total_horas_trabajadas += max(0, horas_trabajadas)
                else:
                    dias_ausentes += 1

            fecha_actual += timedelta(days=1)

        # Estadísticas de horarios
        entradas = registros.filter(tipo='entrada').values_list('hora', flat=True)
        salidas = registros.filter(tipo='salida').values_list('hora', flat=True)

        hora_entrada_promedio = None
        hora_salida_promedio = None

        if entradas:
            total_segundos = sum((datetime.combine(date.today(), hora) - datetime.combine(date.today(), datetime.min.time())).total_seconds() for hora in entradas)
            promedio_segundos = total_segundos / len(entradas)
            hora_entrada_promedio = (datetime.min + timedelta(seconds=promedio_segundos)).time()

        if salidas:
            total_segundos = sum((datetime.combine(date.today(), hora) - datetime.combine(date.today(), datetime.min.time())).total_seconds() for hora in salidas)
            promedio_segundos = total_segundos / len(salidas)
            hora_salida_promedio = (datetime.min + timedelta(seconds=promedio_segundos)).time()

        porcentaje_asistencia = (dias_presentes / dias_laborables * 100) if dias_laborables > 0 else 0
        horas_promedio_diarias = total_horas_trabajadas / dias_presentes if dias_presentes > 0 else 0

        stats = {
            'empleado_id': empleado.id,
            'empleado_nombre': empleado.nombre_completo,
            'mes': mes,
            'anio': anio,
            'dias_laborables': dias_laborables,
            'dias_presentes': dias_presentes,
            'dias_ausentes': dias_ausentes,
            'dias_tardios': dias_tardios,
            'porcentaje_asistencia': round(porcentaje_asistencia, 1),
            'total_horas_trabajadas': round(total_horas_trabajadas, 2),
            'horas_promedio_diarias': round(horas_promedio_diarias, 2),
            'hora_entrada_promedio': hora_entrada_promedio,
            'hora_salida_promedio': hora_salida_promedio
        }

        return Response(stats)

    def _calcular_dias_laborables(self, fecha_inicio, fecha_fin):
        """Calcular días laborables (lunes a viernes) en un rango"""
        dias_laborables = 0
        fecha_actual = fecha_inicio

        while fecha_actual <= fecha_fin:
            if fecha_actual.weekday() < 5:  # 0=lunes, 4=viernes
                dias_laborables += 1
            fecha_actual += timedelta(days=1)

        return dias_laborables

    @action(detail=False, methods=['get'])
    def reporte_asistencia(self, request):
        """Reporte de asistencia por empleado y período"""
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if not fecha_inicio or not fecha_fin:
            return Response(
                {'error': 'Se requieren fecha_inicio y fecha_fin'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calcular días laborales en el período (excluir sábados y domingos)
        dias_periodo = 0
        current_date = fecha_inicio
        while current_date <= fecha_fin:
            if current_date.weekday() < 5:  # Lunes=0, Viernes=4
                dias_periodo += 1
            current_date += timedelta(days=1)

        empleados = Empleado.objects.filter(estado='activo')
        reporte_data = []

        for empleado in empleados:
            # Días únicos con registros
            dias_trabajados = RegistroAsistencia.objects.filter(
                empleado=empleado,
                fecha__range=[fecha_inicio, fecha_fin],
                fecha__week_day__in=[2, 3, 4, 5, 6]  # Lunes a Viernes
            ).values('fecha').distinct().count()

            dias_faltantes = max(0, dias_periodo - dias_trabajados)

            # Calcular horas trabajadas más preciso
            dias_completos = RegistroAsistencia.objects.filter(
                empleado=empleado,
                fecha__range=[fecha_inicio, fecha_fin],
                tipo='entrada'
            ).filter(
                empleado__registros_asistencia__tipo='salida',
                empleado__registros_asistencia__fecha=F('fecha')
            ).values('fecha').distinct().count()

            horas_totales = dias_completos * 8  # Asumiendo 8 horas por día completo

            porcentaje_asistencia = (dias_trabajados / dias_periodo) * 100 if dias_periodo > 0 else 0

            reporte_data.append({
                'empleado_id': empleado.id,
                'empleado_nombre': empleado.nombre_completo,
                'dias_trabajados': dias_trabajados,
                'dias_faltantes': dias_faltantes,
                'horas_totales': horas_totales,
                'porcentaje_asistencia': round(porcentaje_asistencia, 1)
            })

        serializer = AsistenciaReporteSerializer(reporte_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def empleado_mes(self, request):
        """Asistencia de un empleado específico por mes"""
        empleado_id = request.query_params.get('empleado_id')
        year = request.query_params.get('year', str(date.today().year))
        month = request.query_params.get('month', str(date.today().month))

        if not empleado_id:
            return Response(
                {'error': 'Se requiere empleado_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            empleado = Empleado.objects.get(id=empleado_id)
            year = int(year)
            month = int(month)
        except (Empleado.DoesNotExist, ValueError):
            return Response(
                {'error': 'Empleado no encontrado o parámetros inválidos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener todos los registros del empleado para el mes
        registros = RegistroAsistencia.objects.filter(
            empleado=empleado,
            fecha__year=year,
            fecha__month=month
        ).order_by('fecha', 'hora')

        serializer = self.get_serializer(registros, many=True)
        return Response({
            'empleado': {
                'id': empleado.id,
                'nombre': empleado.nombre_completo,
                'numero': empleado.numero_empleado
            },
            'periodo': f"{month}/{year}",
            'registros': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas_empleado(self, request):
        """Estadísticas detalladas de un empleado específico"""
        empleado_id = request.query_params.get('empleado_id')
        year = request.query_params.get('year', str(date.today().year))

        if not empleado_id:
            return Response(
                {'error': 'Se requiere empleado_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            empleado = Empleado.objects.get(id=empleado_id)
            year = int(year)
        except (Empleado.DoesNotExist, ValueError):
            return Response(
                {'error': 'Empleado no encontrado o parámetros inválidos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener registros del año
        registros_year = RegistroAsistencia.objects.filter(
            empleado=empleado,
            fecha__year=year
        )

        # Calcular estadísticas
        total_dias_trabajados = registros_year.values('fecha').distinct().count()

        # Entradas y salidas para calcular promedios
        entradas = registros_year.filter(tipo='entrada')
        salidas = registros_year.filter(tipo='salida')

        # Calcular hora promedio de entrada
        promedio_entrada = None
        if entradas.exists():
            horas_entrada = [r.hora for r in entradas]
            total_minutos = sum(
                hora.hour * 60 + hora.minute
                for hora in horas_entrada
            )
            promedio_minutos = total_minutos / len(horas_entrada)
            horas_prom = int(promedio_minutos // 60)
            minutos_prom = int(promedio_minutos % 60)
            promedio_entrada = f"{horas_prom:02d}:{minutos_prom:02d}"

        # Calcular hora promedio de salida
        promedio_salida = None
        if salidas.exists():
            horas_salida = [r.hora for r in salidas]
            total_minutos = sum(
                hora.hour * 60 + hora.minute
                for hora in horas_salida
            )
            promedio_minutos = total_minutos / len(horas_salida)
            horas_prom = int(promedio_minutos // 60)
            minutos_prom = int(promedio_minutos % 60)
            promedio_salida = f"{horas_prom:02d}:{minutos_prom:02d}"

        # Días que llegó tarde (después de las 8:00 AM)
        from datetime import time as time_obj
        dias_tarde = entradas.filter(hora__gt=time_obj(8, 0)).count()

        # Calcular días laborales del año (aproximado)
        import calendar
        dias_laborales_year = 0
        for mes in range(1, 13):
            dias_mes = calendar.monthrange(year, mes)[1]
            for dia in range(1, dias_mes + 1):
                fecha_dia = date(year, mes, dia)
                if fecha_dia.weekday() < 5:  # Lunes a Viernes
                    dias_laborales_year += 1

        dias_ausente = max(0, dias_laborales_year - total_dias_trabajados)
        porcentaje_asistencia = (total_dias_trabajados / dias_laborales_year * 100) if dias_laborales_year > 0 else 0

        # Calcular horas totales trabajadas (aproximado)
        dias_completos = entradas.filter(
            empleado__registros_asistencia__tipo='salida',
            empleado__registros_asistencia__fecha=F('fecha')
        ).values('fecha').distinct().count()
        total_horas = dias_completos * 8

        # Tendencia mensual
        tendencia_mensual = []
        meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

        for mes_num in range(1, 13):
            registros_mes = registros_year.filter(fecha__month=mes_num)
            dias_trabajados_mes = registros_mes.values('fecha').distinct().count()

            # Calcular días laborales del mes
            dias_laborales_mes = 0
            dias_mes = calendar.monthrange(year, mes_num)[1]
            for dia in range(1, dias_mes + 1):
                fecha_dia = date(year, mes_num, dia)
                if fecha_dia.weekday() < 5:
                    dias_laborales_mes += 1

            porcentaje_mes = (dias_trabajados_mes / dias_laborales_mes * 100) if dias_laborales_mes > 0 else 0

            tendencia_mensual.append({
                'mes': meses[mes_num - 1],
                'dias_trabajados': dias_trabajados_mes,
                'porcentaje': round(porcentaje_mes, 1)
            })

        estadisticas = {
            'empleado_id': empleado.id,
            'empleado_nombre': empleado.nombre_completo,
            'year': year,
            'total_dias_trabajados': total_dias_trabajados,
            'total_horas': total_horas,
            'promedio_entrada': promedio_entrada,
            'promedio_salida': promedio_salida,
            'dias_tarde': dias_tarde,
            'dias_ausente': dias_ausente,
            'porcentaje_asistencia': round(porcentaje_asistencia, 1),
            'tendencia_mensual': tendencia_mensual
        }

        return Response(estadisticas)


class NominaViewSet(viewsets.ModelViewSet):
    queryset = Nomina.objects.select_related('empleado')
    serializer_class = NominaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['empleado', 'año', 'mes', 'periodo', 'estado']
    search_fields = ['empleado__nombres', 'empleado__apellidos']
    ordering_fields = ['año', 'mes', 'fecha_creacion']
    ordering = ['-año', '-mes']
    
    def perform_create(self, serializer):
        serializer.save(calculada_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def calcular(self, request, pk=None):
        """Calcular totales de nómina"""
        nomina = self.get_object()
        nomina.calcular_totales()
        nomina.estado = 'calculada'
        nomina.fecha_calculo = timezone.now()
        nomina.calculada_por = request.user
        nomina.save()
        
        serializer = self.get_serializer(nomina)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar nómina"""
        nomina = self.get_object()
        
        if nomina.estado not in ['calculada', 'borrador']:
            return Response(
                {'error': 'Solo se pueden aprobar nóminas calculadas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        nomina.estado = 'aprobada'
        nomina.fecha_aprobacion = timezone.now()
        nomina.aprobada_por = request.user
        nomina.save()
        
        serializer = self.get_serializer(nomina)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def marcar_pagada(self, request, pk=None):
        """Marcar nómina como pagada"""
        nomina = self.get_object()
        
        if nomina.estado != 'aprobada':
            return Response(
                {'error': 'Solo se pueden marcar como pagadas nóminas aprobadas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        nomina.estado = 'pagada'
        nomina.fecha_pago = timezone.now()
        nomina.save()
        
        serializer = self.get_serializer(nomina)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def generar_nominas_mes(self, request):
        """Generar nóminas para todos los empleados activos del mes"""
        año = request.data.get('año', date.today().year)
        mes = request.data.get('mes', date.today().month)
        periodo = request.data.get('periodo', 'mensual')
        
        empleados_activos = Empleado.objects.filter(estado='activo')
        nominas_creadas = 0
        
        for empleado in empleados_activos:
            # Verificar si ya existe nómina para este período
            if not Nomina.objects.filter(empleado=empleado, año=año, mes=mes, periodo=periodo).exists():
                # Calcular fechas del período
                primer_dia = date(año, mes, 1)
                ultimo_dia = date(año, mes, calendar.monthrange(año, mes)[1])
                
                Nomina.objects.create(
                    empleado=empleado,
                    periodo=periodo,
                    fecha_inicio=primer_dia,
                    fecha_fin=ultimo_dia,
                    año=año,
                    mes=mes,
                    salario_base=empleado.salario_base,
                    calculada_por=request.user
                )
                nominas_creadas += 1
        
        return Response({
            'mensaje': f'Se crearon {nominas_creadas} nóminas para {mes}/{año}',
            'nominas_creadas': nominas_creadas
        })


class DocumentoEmpleadoViewSet(viewsets.ModelViewSet):
    queryset = DocumentoEmpleado.objects.select_related('empleado')
    serializer_class = DocumentoEmpleadoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['empleado', 'tipo']
    search_fields = ['empleado__nombres', 'empleado__apellidos', 'nombre']
    ordering_fields = ['fecha_subida', 'fecha_vencimiento']
    ordering = ['-fecha_subida']
    
    def perform_create(self, serializer):
        serializer.save(subido_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Documentos vencidos"""
        vencidos = self.get_queryset().filter(
            fecha_vencimiento__lt=date.today()
        ).exclude(fecha_vencimiento__isnull=True)
        
        serializer = self.get_serializer(vencidos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_vencer(self, request):
        """Documentos que vencen en los próximos 30 días"""
        fecha_limite = date.today() + timedelta(days=30)
        por_vencer = self.get_queryset().filter(
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=date.today()
        )
        
        serializer = self.get_serializer(por_vencer, many=True)
        return Response(serializer.data)


class EvaluacionDesempenoViewSet(viewsets.ModelViewSet):
    queryset = EvaluacionDesempeno.objects.select_related('empleado', 'evaluador')
    serializer_class = EvaluacionDesempenoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['empleado', 'evaluador', 'periodo', 'fecha_evaluacion__year']
    search_fields = ['empleado__nombres', 'empleado__apellidos']
    ordering_fields = ['fecha_evaluacion', 'fecha_creacion']
    ordering = ['-fecha_evaluacion']
    
    @action(detail=False, methods=['get'])
    def promedio_por_empleado(self, request):
        """Promedio de evaluaciones por empleado"""
        empleado_id = request.query_params.get('empleado_id')
        
        if not empleado_id:
            return Response(
                {'error': 'Se requiere empleado_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        evaluaciones = self.get_queryset().filter(empleado_id=empleado_id)
        
        if not evaluaciones.exists():
            return Response({'mensaje': 'No hay evaluaciones para este empleado'})
        
        promedios = evaluaciones.aggregate(
            calidad_trabajo=Avg('calidad_trabajo'),
            puntualidad=Avg('puntualidad'),
            comunicacion=Avg('comunicacion'),
            trabajo_equipo=Avg('trabajo_equipo'),
            iniciativa=Avg('iniciativa')
        )
        
        promedio_general = sum(promedios.values()) / len(promedios)
        
        return Response({
            'empleado_id': empleado_id,
            'total_evaluaciones': evaluaciones.count(),
            'promedio_general': round(promedio_general, 2),
            'promedios_por_categoria': promedios
        })