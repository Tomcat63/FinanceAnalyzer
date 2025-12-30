# Stage 1: Frontend Build (Node.js 20 nutzen!)
FROM node:20-alpine AS builder
WORKDIR /app/frontend

# Umgebungsvariable für statischen Export (falls nötig)
ENV NEXT_TELEMETRY_DISABLED 1

COPY frontend/package*.json ./

# Fix für den React 19 Konflikt
RUN npm install --legacy-peer-deps

COPY frontend/ ./

# Build ausführen
RUN npm run build

# Stage 2: Final Image (Python)
FROM python:3.11-slim
WORKDIR /app

# Erstelle notwendige Verzeichnisse
RUN mkdir -p frontend/out

# Installiere Backend-Abhängigkeiten
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere Backend-Code und das gebaute Frontend aus dem Builder
COPY backend/ ./backend/
COPY --from=builder /app/frontend/out ./frontend/out

# Port für Railway
EXPOSE 8080

# Start-Befehl
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]