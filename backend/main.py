import sys
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Diagnostic Logging for DevOps/Railway
logger.info(f"Current Working Directory: {os.getcwd()}")
logger.info(f"Python Path: {sys.path}")

try:
    from .memory_store import store
    from .parsers.factory import ParserFactory
    from .services import (
        categorize_transaction, 
        detect_recurring_patterns, 
        is_fixed_cost, 
        analyze_with_ai,
        calculate_balance_history,
        calculate_50_30_20_metrics,
        detector
    )
except ImportError:
    # Fallback for local execution if not run as a package
    from memory_store import store
    from parsers.factory import ParserFactory
    from services import (
        categorize_transaction, 
        detect_recurring_patterns, 
        is_fixed_cost, 
        analyze_with_ai,
        calculate_balance_history,
        calculate_50_30_20_metrics,
        detector
    )

# Load environment variables
load_dotenv()

app = FastAPI(title="Finance Analyzer API")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...), x_session_id: str = None):
    session_id = x_session_id or "default"
    contents = await file.read()
    
    # ... (Encoding logic)
    encodings = ['utf-8', 'cp1252', 'iso-8859-1', 'latin1']
    content_str = None
    for enc in encodings:
        try:
            content_str = contents.decode(enc)
            break
        except UnicodeDecodeError:
            continue
            
    if content_str is None:
        raise HTTPException(status_code=400, detail="Could not decode file.")

    try:
        parser = ParserFactory.get_parser(content_str)
        transactions, metadata = parser.parse(content_str)
        
        df = pd.DataFrame([t.model_dump(by_alias=True) for t in transactions])
        if df.empty:
            return {"count": 0, "transactions": [], "bank": parser.bank_name}

        # 1. Detect recurring patterns first
        df = detect_recurring_patterns(df)
        
        # 2. Use the new robust detector for fixed costs
        df = detector.process_dataframe(df)
        
        # 3. Synchronize with legacy fields for backward compatibility
        df['Fixkosten'] = df['Fixkosten_Status']
        df['Kategorie'] = df.apply(categorize_transaction, axis=1)

        # 4. Calculate 50-30-20 metrics
        financial_metrics = calculate_50_30_20_metrics(df)

        data = df.to_dict(orient='records')
        
        balance_history = []
        if metadata and "balance" in metadata:
            balance_history = calculate_balance_history(data, metadata["balance"])

        # In-Memory speichern
        store.save(session_id, data)

        return {
            "count": len(data),
            "transactions": data,
            "bank": parser.bank_name,
            "metadata": metadata,
            "balance_history": balance_history,
            "financial_metrics": financial_metrics
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/financial-health")
async def get_financial_health(x_session_id: str = None):
    session_id = x_session_id or "default"
    data = store.get(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="No session data found. Please upload a CSV first.")
    
    df = pd.DataFrame(data)
    metrics = calculate_50_30_20_metrics(df)
    
    # Also provide fixed cost category breakdown for charts
    fixed_costs = df[df['Fixkosten'] == True]
    category_breakdown = []
    if not fixed_costs.empty:
        cat_groups = fixed_costs.groupby('Fixkosten_Kategorie')
        for cat_name, group in cat_groups:
            cat_sum = abs(group['Betrag'].sum())
            category_breakdown.append({
                "name": str(cat_name),
                "amount": round(cat_sum, 2),
                "count": len(group)
            })
            
    return {
        "metrics": metrics,
        "breakdown": category_breakdown
    }

@app.post("/api/clear")
async def clear_session_data(x_session_id: str = None):
    session_id = x_session_id or "default"
    store.clear(session_id)
    return {"status": "cleared", "session": session_id}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/demo-data")
def get_demo_data():
    """Serve the mock CSV data for demo mode"""
    try:
        csv_path = os.path.join(os.path.dirname(__file__), "test_data_mock.csv")
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="Demo data file not found")
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            csv_content = f.read()
        
        return {"csv_content": csv_content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo data: {str(e)}")

class ChatRequest(BaseModel):
    category_summaries: List[Dict[str, Any]]
    top_transactions: List[Dict[str, Any]]
    user_prompt: str = None

@app.post("/api/chat")
async def chat_with_ai_endpoint(request: ChatRequest):
    try:
        ai_content = await analyze_with_ai(
            request.category_summaries,
            request.top_transactions,
            request.user_prompt
        )
        return {"response": ai_content, "text": ai_content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Systemfehler bei der KI-Analyse: {str(e)}")

# Mount static frontend files
# This must be at the end so it doesn't catch /api routes
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
