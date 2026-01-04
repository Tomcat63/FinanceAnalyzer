#!/bin/bash

echo "========================================"
echo "STARTE VOLLSTÄNDIGEN PROJEKT-CHECK"
echo "========================================"

# Verzeichnisse fuer Logs erstellen
mkdir -p logs

# Backend Tests
echo "[1/3] Backend-Tests laufen..."
cd backend
python3 -m pytest --junitxml=../logs/backend-results.xml
BACKEND_EXIT=$?
cd ..

# Frontend Tests
echo "[2/3] Frontend-Tests laufen..."
if [ ! -d "frontend/node_modules" ]; then
    echo "[WARN] Frontend-Dependencies fehlen. Starte npm install..."
    cd frontend && npm install && cd ..
fi

cd frontend
npm test
FRONTEND_EXIT=$?
cd ..

# Ergebnis Zusammenfassung
echo "[3/3] Zusammenfassung der Ergebnisse..."
python3 summary_collector.py

if [ $BACKEND_EXIT -ne 0 ]; then
    echo "BACKEND FEHLGESCHLAGEN"
fi

if [ $FRONTEND_EXIT -ne 0 ]; then
    echo "FRONTEND FEHLGESCHLAGEN"
fi

if [ $BACKEND_EXIT -ne 0 ] || [ $FRONTEND_EXIT -ne 0 ]; then
    exit 1
fi
