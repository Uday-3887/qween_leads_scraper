@echo off
chcp 65001 >nul
title ITCYBER - Starting All Services
color 0A

echo.
echo ========================================
echo   ITCYBER Lead Scraping Dashboard
echo   Starting All Services...
echo ========================================
echo.

REM Check if backend setup is done
if not exist "backend\venv" (
    echo [!] Backend not set up yet. Running setup first...
    echo.
    call setup_backend.bat
    if errorlevel 1 (
        echo [ERROR] Backend setup failed
        pause
        exit /b 1
    )
)

echo.
echo [✓] Starting Backend Server...
start "ITCYBER Backend" cmd /k "call start_backend.bat"

REM Wait a bit for backend to start
echo.
echo Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak >nul

echo.
echo [✓] Starting Frontend Server...
start "ITCYBER Frontend" cmd /k "call start_frontend.bat"

echo.
echo ========================================
echo   All Services Started!
echo ========================================
echo.
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8766
echo.
echo Open your browser and go to:
echo http://127.0.0.1:5173
echo.
echo Press any key to close this window
echo (Servers will keep running in their windows)
echo.
pause >nul
