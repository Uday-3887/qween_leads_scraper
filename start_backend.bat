@echo off
chcp 65001 >nul
title ITCYBER Backend Server
color 0B

echo.
echo ========================================
echo   ITCYBER Backend Server
echo ========================================
echo.

REM Check if backend folder exists
if not exist "backend" (
    echo [ERROR] Backend folder not found!
    echo Please run 'setup_backend.bat' first.
    pause
    exit /b 1
)

cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo [ERROR] Virtual environment not found!
    echo Please run 'setup_backend.bat' first.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo [✓] Starting backend server...
echo.
echo Server will run at: http://127.0.0.1:8766
echo Health check: http://127.0.0.1:8766/api/health
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

python dashboard_server.py --host 127.0.0.1 --port 8766 --no-open

pause
