@echo off
chcp 65001 >nul
title ITCYBER - Complete System Test
color 0B

echo.
echo ========================================
echo   ITCYBER Complete System Test
echo ========================================
echo.

set errors=0
set warnings=0

REM Test 1: Check Backend Health
echo [TEST 1/7] Checking Backend Health...
curl -s http://127.0.0.1:8766/api/health >nul 2>&1
if errorlevel 1 (
    echo [✗] Backend NOT running at http://127.0.0.1:8766
    echo     Start backend first: start_backend.bat
    set /a errors+=1
) else (
    echo [✓] Backend is running
    curl -s http://127.0.0.1:8766/api/health
    echo.
)
echo.

REM Test 2: Check Frontend Build
echo [TEST 2/7] Checking Frontend Build...
if exist "dist\index.html" (
    echo [✓] Frontend build exists
) else (
    echo [✗] Frontend NOT built
    echo     Run: npm run build
    set /a errors+=1
)
echo.

REM Test 3: Check Node Modules
echo [TEST 3/7] Checking Frontend Dependencies...
if exist "node_modules" (
    echo [✓] Frontend dependencies installed
) else (
    echo [✗] Frontend dependencies NOT installed
    echo     Run: npm install
    set /a errors+=1
)
echo.

REM Test 4: Check Backend Virtual Environment
echo [TEST 4/7] Checking Backend Environment...
if exist "backend\venv" (
    echo [✓] Backend virtual environment exists
) else (
    echo [✗] Backend NOT set up
    echo     Run: setup_backend.bat
    set /a errors+=1
)
echo.

REM Test 5: Check Backend Requirements
echo [TEST 5/7] Checking Backend Files...
set backend_ok=1
if not exist "backend\dashboard_server.py" (
    echo [✗] dashboard_server.py missing
    set backend_ok=0
    set /a errors+=1
)
if not exist "backend\connected_scraper.py" (
    echo [✗] connected_scraper.py missing
    set backend_ok=0
    set /a errors+=1
)
if not exist "backend\requirements.txt" (
    echo [✗] requirements.txt missing
    set backend_ok=0
    set /a errors+=1
)
if %backend_ok%==1 (
    echo [✓] All backend files present
)
echo.

REM Test 6: Check Port Availability
echo [TEST 6/7] Checking Ports...
netstat -ano | findstr ":5173" >nul 2>&1
if errorlevel 1 (
    echo [!] Port 5173 is free (frontend not running)
    set /a warnings+=1
) else (
    echo [✓] Port 5173 is in use (frontend running)
)

netstat -ano | findstr ":8766" >nul 2>&1
if errorlevel 1 (
    echo [✗] Port 8766 is free (backend not running)
    set /a errors+=1
) else (
    echo [✓] Port 8766 is in use (backend running)
)
echo.

REM Test 7: Check Configuration
echo [TEST 7/7] Checking Configuration...
if exist "vite.config.js" (
    echo [✓] Vite config exists
) else (
    echo [✗] Vite config missing
    set /a errors+=1
)
echo.

REM Summary
echo ========================================
echo   Test Summary
echo ========================================
echo.
echo Errors:   %errors%
echo Warnings: %warnings%
echo.

if %errors% equ 0 (
    echo [✓✓✓] ALL TESTS PASSED!
    echo.
    echo System is ready to use!
    echo.
    if %warnings% gtr 0 (
        echo Note: Frontend is not running yet.
        echo Run: npm run dev
        echo Then open: http://127.0.0.1:5173
    ) else (
        echo Both frontend and backend are running!
        echo Open: http://127.0.0.1:5173
    )
) else (
    echo [✗✗✗] %errors% ERROR(S) FOUND
    echo.
    echo Please fix the errors above and run this test again.
    echo.
    echo Quick fixes:
    echo - Backend not running: start_backend.bat
    echo - Frontend not built: npm run build
    echo - Dependencies missing: npm install
    echo - Backend not setup: setup_backend.bat
)

echo.
pause
