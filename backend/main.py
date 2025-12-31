from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import json
import os
import requests
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Dict, Any

# Load environment variables
load_dotenv()

app = FastAPI(title="Finance Analyzer API")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://finance-analyzer-phi.vercel.app", # Adjust if Vercel URL is different
        "https://financeanalyzer-production.up.railway.app",
        "*" # Keep wildcard for now to be safe during testing
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

CATEGORIES = {
    "Wohnen": ["Miete", "Nebenkosten", "Strom", "Gas", "Vermieter", "Hausverwaltung", "Grundsteuer", "Rundfunkbeitrag", "GEZ"],
    "Essen": ["Edeka", "Rewe", "Aldi", "Lidl", "Netto", "Supermarkt", "Bäcker", "Penny", "Kaufland", "Alnatura", "Denns"],
    "Amazon": ["Amazon", "Audible", "Prime Video", "Marketplace"],
    "Shopping": ["Zalando", "H&M", "Zara", "Douglas", "Media Markt", "Saturn", "IKEA", "Action", "Mango", "Asos"],
    "Tanken/Auto": ["Shell", "Aral", "Total", "Esso", "Jet", "Tankstelle", "KFZ", "Werkstatt", "Autohaus", "Versicherung"],
    "Reisen/Mobilität": ["DB Vertrieb", "Lufthansa", "Airbnb", "Booking.com", "Uber", "Taxi", "Flugticket", "Ryanair", "Eurowings", "VVS", "HVV", "BVG"],
    "Freizeit": ["Kino", "Fitness", "Netflix", "Spotify", "Disney+", "Restaurant", "Bar", "McFit", "FitX", "Eversports", "Steam", "Nintendo"],
    "Gehalt": ["Gehalt", "Lohn", "Arbeitgeber", "Besoldung", "Rente"],
    "Bank/Finanzen": ["Zinsen", "Dividende", "Depot", "Trade Republic", "Scalable", "DKB", "Sparkasse", "Volksbank"],
}

def detect_recurring_patterns(df):
    """Detect recurring transactions based on frequency and amount."""
    if df.empty:
        return df

    # Ensure Buchungsdatum is datetime
    df['temp_date'] = pd.to_datetime(df['Buchungsdatum'], errors='coerce')
    
    # Sort by date
    df = df.sort_values(['Zahlungsempfänger', 'Betrag', 'temp_date'])
    
    # Initialize column
    df['Wiederkehrend'] = False
    
    # Group by Payee and Amount to find potential patterns
    groups = df.groupby(['Zahlungsempfänger', 'Betrag'])
    
    for (payee, amount), group in groups:
        if len(group) < 2:
            continue
            
        # Calculate diffs between dates in days
        diffs = group['temp_date'].diff().dt.days
        
        # Check if any diff is in the typical monthly range (27-34 days)
        # We consider it recurring if at least one gap is monthly-like
        # or if the average gap is around 30 days.
        is_monthly = diffs.apply(lambda x: 27 <= x <= 34 if pd.notna(x) else False).any()
        
        if is_monthly:
            df.loc[group.index, 'Wiederkehrend'] = True
            
    # Cleanup
    df = df.drop(columns=['temp_date'])
    return df

def is_fixed_cost(row):
    """Simple heuristic for fixed costs combined with frequency detection."""
    fixed_keywords = ["miete", "dauerauftrag", "versicherung", "abo", "netflix", "spotify", "rundfunk", "beitrag", "gehalt"]
    text = f"{str(row['Zahlungsempfänger']).lower()} {str(row['Verwendungszweck']).lower()}"
    
    # Keyword match
    keyword_match = any(kw in text for kw in fixed_keywords)
    
    # If it was detected as recurring by frequency or matches keywords
    return keyword_match or row.get('Wiederkehrend', False)

def categorize_transaction(row):
    text = f"{str(row['Zahlungsempfänger']).lower()} {str(row['Verwendungszweck']).lower()}"
    for category, keywords in CATEGORIES.items():
        if any(keyword.lower() in text for keyword in keywords):
            return category
    return "Sonstiges"

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    
    # Try different encodings
    encodings = ['utf-8', 'cp1252', 'iso-8859-1', 'latin1']
    content_str = None
    
    for enc in encodings:
        try:
            content_str = contents.decode(enc)
            break
        except UnicodeDecodeError:
            continue
            
    if content_str is None:
        return {"error": "Could not decode file with common encodings."}

    # Find the header row
    lines = content_str.splitlines()
    header_idx = -1
    for i, line in enumerate(lines):
        # Specific search for DKB header keywords
        clean_line = line.replace('"', '')
        if "Buchungsdatum" in clean_line or "Buchungstag" in clean_line:
            header_idx = i
            break
            
    if header_idx == -1:
        return {"error": "Could not find valid transaction header in CSV."}

    # Re-read CSV from the header row
    try:
        # Use dtype=str to prevent pandas from incorrectly parsing dates as numbers
        # especially when thousands='.' is set.
        df = pd.read_csv(
            io.StringIO("\n".join(lines[header_idx:])),
            sep=';',
            quotechar='"',
            dtype=str
        )
    except Exception as e:
        return {"error": f"Error parsing CSV: {str(e)}"}

    # Basic cleaning
    df = df.dropna(subset=[df.columns[0]])
    
    # Standardize column names
    column_mapping = {
        'Zahlungsempfänger*in': 'Zahlungsempfänger',
        'Auftraggeber / Begünstigter': 'Zahlungsempfänger',
        'Buchungstext': 'Verwendungszweck',
        'Betrag (EUR)': 'Betrag'
    }
    df = df.rename(columns=column_mapping)
    
    # Ensure mandatory columns exist
    required_cols = ['Buchungsdatum', 'Zahlungsempfänger', 'Verwendungszweck', 'Betrag']
    for col in required_cols:
        if col not in df.columns:
            matches = [c for c in df.columns if col.lower() in c.lower()]
            if matches:
                df = df.rename(columns={matches[0]: col})
            else:
                df[col] = ""

    # Clean up Transaction data
    df['Zahlungsempfänger'] = df['Zahlungsempfänger'].fillna("Unbekannt")
    df['Verwendungszweck'] = df['Verwendungszweck'].fillna("")
    
    # Categorization and Fixed Cost detection
    df['Kategorie'] = df.apply(categorize_transaction, axis=1)
    df['Fixkosten'] = df.apply(is_fixed_cost, axis=1)
    
    # Convert dates to ISO format for JSON
    date_cols = ['Buchungsdatum', 'Wertstellung']
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], dayfirst=True, errors='coerce').dt.strftime('%Y-%m-%d')

    # Convert Betrag to float - handle German number format manually
    def parse_german_amount(val):
        if pd.isna(val) or val == "":
            return 0.0
        try:
            # Remove thousands separator and replace decimal comma
            clean_val = str(val).replace('.', '').replace(',', '.')
            return float(clean_val)
        except (ValueError, TypeError):
            return 0.0

    df['Betrag'] = df['Betrag'].apply(parse_german_amount)

    # Filter out empty/invalid transactions before frequency check
    df = df[df['Buchungsdatum'].notna()]

    # Advanced Frequency Analysis
    df = detect_recurring_patterns(df)

    # Final logic for Fixkosten (Keywords + Frequency)
    df['Fixkosten'] = df.apply(is_fixed_cost, axis=1)

    # Sort back to original or by date descending
    df = df.sort_values('Buchungsdatum', ascending=False)

    # Ensure JSON compliance by replacing NaN with empty strings
    df = df.fillna('')

    # Convert to dictionary
    data = df.to_dict(orient='records')
    
    return {
        "count": len(data),
        "transactions": data
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/demo-data")
def get_demo_data():
    """Serve the mock CSV data for demo mode"""
    try:
        csv_path = os.path.join(os.path.dirname(__file__), "test_data_mock.csv")
        if not os.path.exists(csv_path):
            return {"error": "Demo data file not found"}
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            csv_content = f.read()
        
        return {"csv_content": csv_content}
    except Exception as e:
        return {"error": f"Failed to load demo data: {str(e)}"}

class ChatRequest(BaseModel):
    category_summaries: List[Dict[str, Any]]
    top_transactions: List[Dict[str, Any]]
    user_prompt: str = None

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return {"error": "OPENROUTER_API_KEY not found in .env"}
    
    # Modelle in Prioritätsreihenfolge
    models_to_try = [
        "google/gemini-2.0-flash-exp:free",      # Beste Wahl (Schnell & Intelligent)
        "google/gemma-3-27b-it:free",           # Top Alternative (Brandneu)
        "meta-llama/llama-3.3-70b-instruct:free" # Power-Modell (Sehr präzise)
    ]
    
    try:
        # Prepare context for AI
        context = "Du bist ein persönlicher Finanzassistent namens 'Finance Analyzer AI'.\n"
        context += "Analysiere die Finanzdaten des Nutzers und gib eine kurze, knackige Analyse (max. 150-200 Wörter).\n"
        context += "Antworte IMMER auf DEUTSCH und verwende exakt diese Struktur:\n\n"
        context += "1. **Zusammenfassung**: Ein kurzer Satz zum Gesamtzustand der Finanzen.\n"
        context += "2. **Top-Sparpotenzial**: Identifiziere die 2 größten Ausgaben-Kategorien und gib jeweils einen konkreten, praktischen Tipp zum Sparen.\n"
        context += "3. **Auffälligkeiten**: Erwähne ungewöhnlich hohe Einzelbeträge aus den Top 10 Transaktionen.\n"
        context += "4. **Motivation**: Ein kurzer, positiver Abschlusssatz.\n\n"
        context += "Nutze Markdown (Fett, Listen) für eine gute Lesbarkeit. Antworte anschließend kurz auf vietnamesisch.\n\n"
        
        context += "### Kategorien-Zusammenfassung:\n"
        for cat in request.category_summaries:
            context += f"- {cat['name']}: {cat['amount']:.2f} € ({cat['count']} Transaktionen)\n"
        
        context += "\n### Top 10 Einzeltransaktionen (potenzielle Ausreißer):\n"
        for tx in request.top_transactions:
            context += f"- {tx['Buchungsdatum']}: {tx['Zahlungsempfänger']} | {tx['Betrag']:.2f} € | {tx['Verwendungszweck']}\n"
        
        prompt = request.user_prompt if request.user_prompt else "Analysiere diese Daten. Wo gibt es Sparpotential? Gibt es ungewöhnliche hohe Ausgaben? Gib eine kurze, motivierende Zusammenfassung."
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:3000",
            "Content-Type": "application/json"
        }
        
        messages = [
            {"role": "system", "content": context},
            {"role": "user", "content": prompt}
        ]
        
        for model_id in models_to_try:
            print(f"Nutze Modell: {model_id}")
            payload = {
                "model": model_id,
                "messages": messages,
                "max_tokens": 1000,
                "top_p": 1,
                "temperature": 0.7
            }
            
            try:
                response = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=30 # Timeout hinzugefügt
                )
                
                print(f"Antwort-Status für {model_id}: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    ai_content = result['choices'][0]['message']['content']
                    return {"response": ai_content, "text": ai_content}
                
                # Bei 429 (Too Many Requests) oder 5xx (Server Error) -> Nächstes Modell
                if response.status_code == 429 or response.status_code >= 500:
                    print(f"Modell {model_id} fehlgeschlagen mit Status {response.status_code}. Versuche Fallback...")
                    continue
                else:
                    # Bei anderen Fehlern (z.B. 401, 400 ohne Fallback-Bedarf) -> Abbruch mit Fehlermeldung
                    return {"error": f"KI-Anfrage fehlgeschlagen ({model_id}): {response.status_code} - {response.text}"}
                    
            except requests.exceptions.RequestException as e:
                print(f"Netzwerkfehler bei Modell {model_id}: {str(e)}. Versuche Fallback...")
                continue
        
        # Wenn alle Modelle fehlschlagen
        return {"error": "KI-Server aktuell ausgelastet, bitte kurz warten."}
            
    except Exception as e:
        return {"error": f"Systemfehler bei der KI-Analyse: {str(e)}"}

# Mount static frontend files
# This must be at the end so it doesn't catch /api routes
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
