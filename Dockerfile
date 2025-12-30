# --- Stage 1: Frontend Build ---
FROM node:18-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Final Image ---
FROM python:3.11-slim
WORKDIR /app

# Erstelle notwendige Verzeichnisse
RUN mkdir -p frontend/out

# Installiere Backend-Abhängigkeiten
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere Backend-Code und gebautes Frontend
COPY backend/ ./backend/
COPY --from=builder /app/frontend/out ./frontend/out

# Port für Railway
EXPOSE 8080

# Start-Kommando
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
