@echo off
echo ==========================================
echo    CONFIGURACION INICIAL DE DESARROLLO
echo ==========================================
echo.

echo [1/5] Verificando Python...
python --version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python no está instalado o no está en el PATH
    echo Por favor instala Python 3.11+ desde https://python.org
    pause
    exit /b 1
)

echo [2/5] Verificando Node.js...
node --version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo [3/5] Instalando dependencias del backend...
cd backend
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias del backend
    pause
    exit /b 1
)

echo [4/5] Configurando base de datos...
python manage.py makemigrations
python manage.py migrate
python create_initial_data.py

echo [5/5] Instalando dependencias del frontend...
cd ..\frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias del frontend
    pause
    exit /b 1
)

cd..
echo.
echo ==========================================
echo   CONFIGURACION COMPLETADA EXITOSAMENTE
echo ==========================================
echo.
echo Ahora puedes ejecutar:
echo   - start_local.bat (para iniciar ambos servidores)
echo   - python test_api.py (para probar la API)
echo.
echo Presiona cualquier tecla para continuar...
pause > nul