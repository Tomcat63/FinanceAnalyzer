@echo off
SETLOCAL EnableDelayedExpansion

echo --------------------------------------------------
echo       DKB FINANCE ANALYZER - BACKEND START
echo --------------------------------------------------

:: 1. Port-Bereinigung
echo [1/3] Pruefe Port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo Port belegt durch PID %%a. Beende Prozess...
    taskkill /f /pid %%a 2>nul
)

:: 2. Start-Vorreitung
echo [2/3] Initialisiere Server...
timeout /t 1 >nul

:: 3. Server Start & Info-Ausgabe
echo [3/3] Starte FastAPI (uvicorn)...
echo.
echo ==================================================
echo   ERFOLGREICH GESTARTET!
echo.
echo   LOKALER ZUGRIFF:    http://localhost:8000
echo   DOKUMENTATION:      http://localhost:8000/docs
echo ==================================================
echo.
echo Druecke STRG+C um den Server zu beenden.
echo.

:: Startet den Server tatsächlich
python -m uvicorn main:app --reload --port 8000

if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo [FEHLER] Backend konnte nicht gestartet werden.
    pause
)