@echo off
echo ========================================
echo   VentVault - Development Startup
echo ========================================
echo.

echo [1/3] Starting Redis...
start "Redis Server" redis-server
timeout /t 2 /nobreak > nul

echo [2/3] Starting Backend...
cd backend
start "VentVault Backend" cmd /k "venv\Scripts\activate && python -m app.main"
cd ..
timeout /t 3 /nobreak > nul

echo [3/3] Starting Frontend...
cd frontend
start "VentVault Frontend" cmd /k "pnpm dev"
cd ..

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul
