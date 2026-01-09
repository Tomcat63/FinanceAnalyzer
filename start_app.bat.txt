@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   FinanceAnalyzer - One-Click Start
echo ========================================

:: 1. Check Prerequisites
echo [1/5] Checking Prerequisites...
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js/npm is not installed or not in PATH.
    pause
    exit /b 1
)

:: 2. Backend Setup
echo [2/5] Setting up Backend...
cd backend
if not exist "requirements.txt" (
    echo [ERROR] backend/requirements.txt not found.
    cd ..
    pause
    exit /b 1
)

:: Check if packages are installed (simple check for uvicorn)
python -c "import uvicorn" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Installing Backend dependencies...
    pip install -r requirements.txt
)

if not exist ".env" (
    echo [WARN] backend/.env missing. Creating template...
    echo GOOGLE_API_KEY=YOUR_API_KEY_HERE > .env
    echo [IMPORTANT] Please add your GOOGLE_API_KEY to backend/.env for AI features.
)

:: Start Backend in a new window
echo [INFO] Starting Backend...
start "FinanceAnalyzer-Backend" cmd /c "python -m uvicorn main:app --reload --port 8000"
cd ..

:: 3. Frontend Setup
echo [3/5] Setting up Frontend...
cd frontend
if not exist "node_modules" (
    echo [INFO] Installing Frontend dependencies...
    call npm install
)

:: 4. Start Browser
echo [4/5] Preparing Browser...
timeout /t 3 >nul
start http://localhost:3000

:: 5. Start Frontend
echo [5/5] Starting Frontend...
echo.
echo ========================================
echo   APP IS STARTING!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo ========================================
echo.
call npm run dev

pause
