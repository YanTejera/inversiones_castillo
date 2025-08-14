@echo off
echo 🚀 Iniciando entorno de desarrollo...
echo.

echo 📂 Configurando backend...
cd backend
if not exist venv (
    echo Creando entorno virtual...
    python -m venv venv
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Instalando dependencias de Python...
pip install -r requirements.txt

echo Aplicando migraciones...
python manage.py migrate

echo Creando datos iniciales...
python create_initial_data.py

echo.
echo ✅ Backend configurado!
echo 🌐 Inicia el backend con: python manage.py runserver
echo 🌐 Admin disponible en: http://localhost:8000/admin (admin/admin123)
echo.
echo 📂 Para el frontend, abre otra terminal y ejecuta:
echo    cd frontend
echo    npm install
echo    npm run dev
echo 🌐 Frontend estará en: http://localhost:5173
echo.
pause