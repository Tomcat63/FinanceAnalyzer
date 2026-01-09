@echo off
setlocal enabledelayedexpansion

echo ========================================
echo STARTE VOLLSTÄNDIGEN PROJEKT-CHECK
echo ========================================

rem Verzeichnisse fuer Logs erstellen
if not exist "logs" mkdir logs
if not exist "backend\logs" mkdir backend\logs

rem Backend Tests
echo [1/3] Backend-Tests laufen...
cd backend
set PYTHONPATH=%PYTHONPATH%;..

rem Check if Backend dependencies are installed
python -c "import uvicorn" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Backend-Dependencies fehlen. Starte pip install...
    pip install -r requirements.txt
)

python -m pytest --junitxml=../logs/backend-results.xml
set BACKEND_EXIT=%ERRORLEVEL%
if %BACKEND_EXIT% neq 0 (
    echo [WARN] Backend Tests fehlgeschlagen oder nicht ausfuehrbar.
)
cd ..

rem Frontend Tests
echo [2/3] Frontend-Tests laufen...
if not exist "frontend\node_modules" (
    echo [WARN] Frontend-Dependencies fehlen. Starte npm install...
    cd frontend 
    call npm install
    cd ..
)

cd frontend
call npm test
set FRONTEND_EXIT=%ERRORLEVEL%
cd ..

rem Ergebnis Zusammenfassung
echo [3/3] Zusammenfassung der Ergebnisse...
python summary_collector.py

rem Exit Code setzen basierend auf Tests
if %BACKEND_EXIT% NEQ 0 (
    echo BACKEND FEHLGESCHLAGEN
    exit /b %BACKEND_EXIT%
)

if %FRONTEND_EXIT% NEQ 0 (
    echo FRONTEND FEHLGESCHLAGEN
    exit /b %FRONTEND_EXIT%
)

echo.
echo ========================================
echo ✅ ALLE TESTS ERFOLREICH
echo ========================================
set /p COMMIT_ANS="Moechtest du die Aenderungen committen? (y/n): "
if /i "!COMMIT_ANS!"=="y" (
    set /p MSG="Commit-Nachricht (Enter fuer Editor): "
    git add .
    if "!MSG!"=="" (
        git commit
    ) else (
        git commit -m "!MSG!"
    )
    
    echo.
    set /p PUSH_ANS="Moechtest du direkt pushen? (y/n): "
    if /i "!PUSH_ANS!"=="y" (
        git push
    )
)

echo Check complete.
echo.
set /p START_ANS="Moechtest du die App jetzt starten? (y/n): "
if /i "!START_ANS!"=="y" (
    call start_app.bat
)
pause

