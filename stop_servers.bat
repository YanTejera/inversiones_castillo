@echo off
echo Deteniendo servidores del Sistema de Gestión...

echo Cerrando procesos de Django...
taskkill /F /IM python.exe 2>nul

echo Cerrando procesos de Node.js...
taskkill /F /IM node.exe 2>nul

echo Cerrando ventanas de comando...
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Backend Django" 2>nul
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Frontend React" 2>nul

echo.
echo Servidores detenidos.
pause