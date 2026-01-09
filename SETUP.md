# FinanceAnalyzer Setup Guide

This guide will help you set up the FinanceAnalyzer on a new machine.

## Prerequisites

Ensure you have the following installed:
- **Git**
- **Node.js** (v18 or newer)
- **Python** (v3.9 or newer)

## One-Click Setup & Start

The easiest way to get started is by running the `start_app.bat` script in the root directory:

```bash
./start_app.bat
```

This script will:
1. Check for missing dependencies and install them (npm install, pip install).
2. Start the Backend (FastAPI).
3. Start the Frontend (Next.js).
4. Automatically open your browser at `http://localhost:3000`.

## Manual Setup

If you prefer to set up the components manually, follow these steps:

### 1. Backend Setup
1. Navigate to the `backend` folder.
2. (Optional but recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory:
   ```env
   GOOGLE_API_KEY=your_key_here
   ```
5. Start the backend:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Development & Quality Assurance

Before committing changes, please run the full check script:

```bash
./check_all.bat
```

This script runs all tests (Backend & Frontend) and allows you to commit/push directly if everything passes.
