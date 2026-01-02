# Technology Stack

## Frontend (Client)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
    - **Components**: shadcn/ui (Radix Primitives)
    - **Icons**: Lucide React
    - **Animations**: tailwind-animate
- **Visualization**: Tremor (Charts & Dashboards)
- **Utilities**:
    - `date-fns`: Date manipulation
    - `jsPDF`: Client-side PDF generation
    - `clsx` / `tailwind-merge`: Class management

## Backend (Server)
- **Framework**: FastAPI
- **Language**: Python 3.11
- **Server**: Uvicorn (ASGI)
- **Data Processing**: Pandas (DataFrames for CSV parsing & analysis)
- **Validation**: Pydantic v2
- **Persistence**: In-Memory (MemoryStore), Stateless REST API

## AI & Intelligence
- **Provider**: OpenRouter API
- **Models**:
    - **Google Gemini 3 Flash** (Primary Analysis)
    - Meta Llama 3.3 70B (Fallback)
- **Integration**: `requests` (Python) / Server-Side Proxy

## DevOps & Infrastructure
- **Containerization**: Docker (Multi-stage build)
- **Host**: Railway / Vercel (Frontend only) or Docker Monolith
- **Versioning**: Git
