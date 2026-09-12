@echo off
chcp 65001 >nul
title ITCYBER Frontend Server
color 0E

echo.
echo ========================================
echo   ITCYBER Frontend Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        echo Please make sure Node.js is installed
        pause
        exit /b 1
    )
    echo [✓] Dependencies installed
) else (
    echo [1/2] Dependencies already installed
)
echo.

echo [2/2] Starting frontend server...
echo.
echo Frontend will run at: http://127.0.0.1:5173
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call npm run dev

pause
