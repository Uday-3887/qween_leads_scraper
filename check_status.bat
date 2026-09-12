@echo off
chcp 65001 >nul
title ITCYBER - System Check
color 0F

echo.
echo ========================================
echo   ITCYBER System Check
echo ========================================
echo.

REM Check Python
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [✗] Python NOT installed
    echo     Download from: https://python.org
) else (
    echo [✓] Python installed
    python --version
)
echo.

REM Check Node.js
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [✗] Node.js NOT installed
    echo     Download from: https://nodejs.org
) else (
    echo [✓] Node.js installed
    node --version
)
echo.

REM Check npm
echo [3/5] Checking npm...
call npm --version >nul 2>&1
if errorlevel 1 (
    echo [✗] npm NOT installed
) else (
    echo [✓] npm installed
    call npm --version
)
echo.

REM Check backend virtual environment
echo [4/5] Checking Backend Setup...
if exist "backend\venv" (
    echo [✓] Backend virtual environment exists
) else (
    echo [!] Backend NOT set up yet
    echo     Run: setup_backend.bat
)
echo.

REM Check node_modules
echo [5/5] Checking Frontend Dependencies...
if exist "node_modules" (
    echo [✓] Frontend dependencies installed
) else (
    echo [!] Frontend dependencies NOT installed
    echo     Will be installed automatically when you run start_frontend.bat
)
echo.

echo ========================================
echo   Summary
echo ========================================
echo.

REM Count issues
set issues=0

python --version >nul 2>&1
if errorlevel 1 set /a issues+=1

node --version >nul 2>&1
if errorlevel 1 set /a issues+=1

if not exist "backend\venv" set /a issues+=1

if %issues% equ 0 (
    echo [✓] Everything is ready!
    echo.
    echo Run: start_all.bat
    echo.
    echo Then open: http://127.0.0.1:5173
) else (
    echo [!] %issues% issue(s) found
    echo.
    echo Please fix the issues above and run this check again.
    echo.
    if not exist "backend\venv" (
        echo Quick fix: Run setup_backend.bat
    )
)

echo.
pause
