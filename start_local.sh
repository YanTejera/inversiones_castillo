#!/bin/bash
echo "=========================================="
echo "   SISTEMA DE GESTION - CONCESIONARIO"
echo "   Iniciando servidores locales..."
echo "=========================================="
echo

echo "[1/4] Verificando dependencias del backend..."
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: No se pudieron instalar las dependencias del backend"
    exit 1
fi

echo "[2/4] Aplicando migraciones..."
python manage.py migrate
if [ $? -ne 0 ]; then
    echo "ERROR: No se pudieron aplicar las migraciones"
    exit 1
fi

echo "[3/4] Creando datos iniciales..."
python create_initial_data.py

echo "[4/4] Iniciando servidor Django en el puerto 8000..."
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

cd ../frontend
echo
echo "[Frontend] Instalando dependencias de React..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: No se pudieron instalar las dependencias del frontend"
    kill $DJANGO_PID
    exit 1
fi

echo "[Frontend] Iniciando servidor de desarrollo React..."
npm run dev &
REACT_PID=$!

echo
echo "=========================================="
echo "   SERVIDORES INICIADOS CORRECTAMENTE"
echo "=========================================="
echo
echo "Backend (Django):  http://localhost:8000"
echo "Frontend (React):  http://localhost:5173"
echo "Admin Django:      http://localhost:8000/admin"
echo
echo "Usuario por defecto:"
echo "  - Usuario: admin"
echo "  - Password: admin123"
echo
echo "Presiona Ctrl+C para detener ambos servidores..."

# Función para limpiar procesos al salir
cleanup() {
    echo
    echo "Deteniendo servidores..."
    kill $DJANGO_PID 2>/dev/null
    kill $REACT_PID 2>/dev/null
    echo "Servidores detenidos."
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Esperar indefinidamente
wait