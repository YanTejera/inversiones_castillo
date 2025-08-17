@echo off
title Inversiones Castillo - Inicio Rapido

echo.
echo ===============================================================================
echo 🏍️  INVERSIONES CASTILLO - INICIO RAPIDO
echo ===============================================================================
echo.
echo Selecciona una opcion:
echo.
echo [1] Iniciar servidor backend (Django)
echo [2] Iniciar servidor frontend (React)
echo [3] Iniciar ambos servidores
echo [4] Mostrar informacion de produccion
echo [5] Acceder directamente a produccion
echo [0] Salir
echo.
set /p choice="Ingresa tu opcion (0-5): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto info
if "%choice%"=="5" goto production
if "%choice%"=="0" goto exit
goto invalid

:backend
echo.
echo 🔧 Iniciando servidor backend...
cd backend
call start_server.bat
goto end

:frontend
echo.
echo ⚡ Iniciando servidor frontend...
cd frontend
echo.
echo 📋 ENLACES UTILES:
echo    Local:      http://localhost:5173
echo    Produccion: https://inversiones-castillo-frontend.vercel.app
echo    Admin:      http://localhost:8000/admin/ (admin/admin123)
echo.
npm run dev
goto end

:both
echo.
echo 🚀 Iniciando ambos servidores...
echo.
start "Backend Server" cmd /c "cd backend && start_server.bat"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /c "cd frontend && npm run dev"
echo.
echo ✅ Ambos servidores iniciados en ventanas separadas
pause
goto end

:info
echo.
echo 📋 INFORMACION DE PRODUCCION:
echo.
echo 🌐 ENLACES:
echo    Frontend:     https://inversiones-castillo-frontend.vercel.app
echo    Backend:      https://inversiones-castillo-backend.onrender.com
echo    Admin Panel:  https://inversiones-castillo-backend.onrender.com/admin/
echo.
echo 🔐 CREDENCIALES:
echo    Usuario:      admin
echo    Contraseña:   admin123
echo.
echo 🔧 DESARROLLO LOCAL:
echo    Frontend:     http://localhost:5173
echo    Backend:      http://localhost:8000
echo    Admin:        http://localhost:8000/admin/
echo.
pause
goto menu

:production
echo.
echo 🌐 Abriendo enlaces de produccion...
start https://inversiones-castillo-frontend.vercel.app
start https://inversiones-castillo-backend.onrender.com/admin/
echo.
echo ✅ Enlaces abiertos en el navegador
echo    Usuario: admin
echo    Contraseña: admin123
echo.
pause
goto end

:invalid
echo.
echo ❌ Opcion invalida. Intentalo de nuevo.
pause
goto menu

:menu
cls
goto :eof

:exit
echo.
echo 👋 ¡Hasta luego!
exit

:end
pause