@echo off
echo ==========================================
echo    SISTEMA DE GESTION - CONCESIONARIO
echo    Iniciando servidores locales...
echo ==========================================
echo.

echo [1/4] Verificando dependencias del backend...
cd backend
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias del backend
    pause
    exit /b 1
)

echo [2/4] Aplicando migraciones...
python manage.py migrate
if %ERRORLEVEL% neq 0 (
    echo ERROR: No se pudieron aplicar las migraciones
    pause
    exit /b 1
)

echo [3/4] Creando datos iniciales...
python create_initial_data.py

echo [4/4] Iniciando servidor Django en el puerto 8000...
start "Backend Django" cmd /k "python manage.py runserver 0.0.0.0:8000"

cd ..\frontend
echo.
echo [Frontend] Instalando dependencias de React...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias del frontend
    pause
    exit /b 1
)

echo [Frontend] Iniciando servidor de desarrollo React...
start "Frontend React" cmd /k "npm run dev"

echo.
echo ==========================================
echo   SERVIDORES INICIADOS CORRECTAMENTE
echo ==========================================
echo.
echo Backend (Django):  http://localhost:8000
echo Frontend (React):  http://localhost:5173
echo Admin Django:      http://localhost:8000/admin
echo.
echo Usuario por defecto:
echo   - Usuario: admin
echo   - Password: admin123
echo.
echo Presiona cualquier tecla para salir...
pause > nul