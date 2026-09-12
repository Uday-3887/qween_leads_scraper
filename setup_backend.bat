@echo off
chcp 65001 >nul
title ITCYBER Backend Setup
color 0A

echo.
echo ========================================
echo   ITCYBER Backend Setup Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.8 or higher from https://python.org
    pause
    exit /b 1
)

echo [✓] Python is installed
python --version
echo.

REM Check if backend folder exists
if not exist "backend" (
    echo [ERROR] Backend folder not found!
    echo Please make sure you're running this from the project root.
    pause
    exit /b 1
)

echo [✓] Backend folder found
echo.

REM Navigate to backend folder
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [1/4] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [✓] Virtual environment created
) else (
    echo [1/4] Virtual environment already exists
)
echo.

REM Activate virtual environment
echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat
echo [✓] Virtual environment activated
echo.

REM Install dependencies
echo [3/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [✓] Dependencies installed
echo.

REM Install Playwright
echo [4/4] Installing Playwright browser (this may take a few minutes)...
python -m playwright install chromium
if errorlevel 1 (
    echo [ERROR] Failed to install Playwright
    pause
    exit /b 1
)
echo [✓] Playwright installed
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Backend is ready to start.
echo.
echo Next step: Run 'start_backend.bat' to start the server
echo.
pause
