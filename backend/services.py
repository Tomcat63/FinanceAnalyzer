import os
import pandas as pd
import requests
from fastapi import HTTPException
from typing import List, Dict, Any

CATEGORIES = {
    "Wohnen": ["Miete", "Nebenkosten", "Strom", "Gas", "Vermieter", "Hausverwaltung", "Grundsteuer", "Rundfunkbeitrag", "GEZ"],
    "Essen": ["Edeka", "Rewe", "Aldi", "Lidl", "Netto", "Supermarkt", "Bäcker", "Penny", "Kaufland", "Alnatura", "Denns"],
    "Amazon": ["Amazon", "Audible", "Prime Video", "Marketplace"],
    "Shopping": ["Zalando", "H&M", "Zara", "Douglas", "Media Markt", "Saturn", "IKEA", "Action", "Mango", "Asos", "Best Secret"],
    "Tanken/Auto": ["Shell", "Aral", "Total", "Esso", "Jet", "Tankstelle", "KFZ", "Werkstatt", "Autohaus", "Versicherung"],
    "Reisen/Mobilität": ["DB Vertrieb", "Lufthansa", "Airbnb", "Booking.com", "Uber", "Taxi", "Flugticket", "Ryanair", "Eurowings", "VVS", "HVV", "BVG"],
    "Freizeit": ["Kino", "Fitness", "Netflix", "Spotify", "Disney+", "Restaurant", "Bar", "McFit", "FitX", "Eversports", "Steam", "Nintendo"],
    "Gehalt": ["Gehalt", "Lohn", "Arbeitgeber", "Besoldung", "Rente"],
    "Bank/Finanzen": ["Zinsen", "Dividende", "Depot", "Trade Republic", "Scalable", "DKB", "Sparkasse", "Volksbank"],
}

def detect_recurring_patterns(df: pd.DataFrame) -> pd.DataFrame:
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
        is_monthly = diffs.apply(lambda x: 27 <= x <= 34 if pd.notna(x) else False).any()
        
        if is_monthly:
            df.loc[group.index, 'Wiederkehrend'] = True
            
    # Cleanup
    df = df.drop(columns=['temp_date'])
    return df

def is_fixed_cost(row: pd.Series) -> bool:
    """Simple heuristic for fixed costs combined with frequency detection."""
    
    fixed_keywords = ["miete", "dauerauftrag", "versicherung", "abo", "netflix", "spotify", "rundfunk", "beitrag", "gehalt"]
    text = f"{str(row['Zahlungsempfänger']).lower()} {str(row['Verwendungszweck']).lower()}"
    
    # Keyword match
    keyword_match = any(kw in text for kw in fixed_keywords)
    
    # If it was detected as recurring by frequency or matches keywords
    return keyword_match or row.get('Wiederkehrend', False)

def categorize_transaction(row: pd.Series) -> str:
    text = f"{str(row['Zahlungsempfänger']).lower()} {str(row['Verwendungszweck']).lower()}"
    for category, keywords in CATEGORIES.items():
        if any(keyword.lower() in text for keyword in keywords):
            return category
    return "Sonstiges"

async def analyze_with_ai(category_summaries: List[Dict[str, Any]], top_transactions: List[Dict[str, Any]], user_prompt: str = None) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not found in .env")
    
    models_to_try = [
        "google/gemini-2.0-flash-exp:free",
        "google/gemma-3-27b-it:free",
        "meta-llama/llama-3.3-70b-instruct:free"
    ]
    
    context = "Du bist ein persönlicher Finanzassistent namens 'Finance Analyzer AI'.\n"
    context += "Analysiere die Finanzdaten des Nutzers und gib eine kurze, knackige Analyse (max. 150-200 Wörter).\n"
    context += "Antworte IMMER auf DEUTSCH und verwende exakt diese Struktur:\n\n"
    context += "1. **Zusammenfassung**: Ein kurzer Satz zum Gesamtzustand der Finanzen.\n"
    context += "2. **Top-Sparpotenzial**: Identifiziere die 2 größten Ausgaben-Kategorien und gib jeweils einen konkreten, praktischen Tipp zum Sparen.\n"
    context += "3. **Auffälligkeiten**: Erwähne ungewöhnlich hohe Einzelbeträge aus den Top 10 Transaktionen.\n"
    context += "4. **Motivation**: Ein kurzer, positiver Abschlusssatz.\n\n"
    context += "5. **Übersetzung nach vietnamesisch**: Gib die oben genannten Punkte in vietnamesisch.\n\n"
    context += "Nutze Markdown (Fett, Listen) für eine gute Lesbarkeit.\n\n"
    
    context += "### Kategorien-Zusammenfassung:\n"
    for cat in category_summaries:
        context += f"- {cat['name']}: {cat['amount']:.2f} € ({cat['count']} Transaktionen)\n"
    
    context += "\n### Top 10 Einzeltransaktionen (potenzielle Ausreißer):\n"
    for tx in top_transactions:
        context += f"- {tx['Buchungsdatum']}: {tx['Zahlungsempfänger']} | {tx['Betrag']:.2f} € | {tx['Verwendungszweck']}\n"
    
    prompt = user_prompt if user_prompt else "Analysiere diese Daten. Wo gibt es Sparpotential? Gibt es ungewöhnliche hohe Ausgaben? Gib eine kurze, motivierende Zusammenfassung."
    
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
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            
            if response.status_code == 429 or response.status_code >= 500:
                continue
            else:
                raise HTTPException(status_code=response.status_code, detail=f"KI-Anfrage fehlgeschlagen ({model_id}): {response.text}")
                
        except requests.exceptions.RequestException:
            continue
    
    raise HTTPException(status_code=503, detail="KI-Server aktuell ausgelastet, bitte kurz warten.")

def calculate_balance_history(transactions: List[Dict[str, Any]], current_balance: float = 0.0) -> List[Dict[str, Any]]:
    """
    Berechnet den historischen Kontostandverlauf stabil.
    """
    if not transactions:
        return []

    # 1. Wir fügen einen temporären Index hinzu für STABILE Sortierung bei gleichem Datum
    for idx, tx in enumerate(transactions):
        tx['_original_idx'] = idx

    # 2. Sortieren nach Datum (absteigend) und dann nach originalem Index (absteigend)
    # So rekonstruieren wir die Reihenfolge innerhalb eines Tages rückwärts
    sorted_tx = sorted(
        transactions, 
        key=lambda x: (x['Buchungsdatum'], x['_original_idx']), 
        reverse=True
    )
    
    history = []
    temp_balance = current_balance
    
    for tx in sorted_tx:
        tx['Saldo_Danach'] = round(temp_balance, 2)
        history.append({
            "date": tx['Buchungsdatum'],
            "amount": tx['Betrag'],
            "balance": round(temp_balance, 2)
        })
        temp_balance -= tx['Betrag']
        
    # Cleanup: Temporären Index entfernen
    for tx in transactions:
        if '_original_idx' in tx:
            del tx['_original_idx']

    return sorted(history, key=lambda x: x['date'])
