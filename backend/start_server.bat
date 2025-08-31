@echo off
echo.
echo ===============================================================================
echo [MOTO] INVERSIONES CASTILLO - INICIANDO SERVIDOR DE DESARROLLO
echo ===============================================================================
echo.
echo [INFO] INFORMACION DE PRODUCCION:
echo    Frontend:     https://inversiones-castillo-frontend.vercel.app
echo    Backend:      https://inversiones-castillo-backend.onrender.com
echo    Admin Panel:  https://inversiones-castillo-backend.onrender.com/admin/
echo.
echo [AUTH] CREDENCIALES:
echo    Usuario:      admin
echo    Contraseña:   admin123
echo.
echo [LOCAL] SERVIDOR LOCAL:
echo    Frontend:     http://localhost:5173
echo    Backend:      http://localhost:8000
echo    Admin:        http://localhost:8000/admin/
echo    API:          http://localhost:8000/api/
echo.
echo ===============================================================================
echo [START] Iniciando servidor Django...
echo ===============================================================================
echo.

REM Activar entorno virtual si existe
if exist "venv\Scripts\activate.bat" (
    echo [VENV] Activando entorno virtual...
    call venv\Scripts\activate.bat
)

REM Ejecutar el servidor
python manage.py runserver

echo.
echo ===============================================================================
echo [STOP] ¡Servidor detenido! Gracias por usar Inversiones Castillo
echo ===============================================================================
pause