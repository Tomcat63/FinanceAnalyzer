import pandas as pd
import io
from typing import List
from .base import BaseParser, InternalTransaction

class SparkasseParser(BaseParser):
    @property
    def bank_name(self) -> str:
        return "Sparkasse"

    def parse(self, content: str) -> tuple[List[InternalTransaction], Optional[dict]]:
        lines = content.splitlines()
        header_idx = -1
        for i, line in enumerate(lines):
            # Suche nach der Header-Zeile
            if "Buchungstag" in line and ("Begünstigter" in line or "Zahlungspflichtiger" in line):
                header_idx = i
                break
        
        if header_idx == -1:
            # Fallback
            df = pd.read_csv(io.StringIO(content), sep=';', dtype=str)
        else:
            df = pd.read_csv(
                io.StringIO("\n".join(lines[header_idx:])),
                sep=';',
                quotechar='"',
                dtype=str
            )

        transactions = []
        for _, row in df.iterrows():
            date_val = row.get('Buchungstag')
            if pd.isna(date_val) or str(date_val).strip() == "" or str(date_val).lower() == "none":
                continue
            
            try:
                # Betrag von "1.234,56" zu float 1234.56 konvertieren
                amount_raw = row.get('Betrag', '0')
                amount_str = str(amount_raw).replace('.', '').replace(',', '.')
                
                # Datum in ISO Format konvertieren (YYYY-MM-DD)
                iso_date = pd.to_datetime(str(date_val), dayfirst=True).strftime('%Y-%m-%d')
                    
                tx = InternalTransaction(
                    date=iso_date,
                    recipient=str(row.get('Begünstigter/Zahlungspflichtiger', row.get('Begünstigter', "Unbekannt"))),
                    purpose=str(row.get('Verwendungszweck', "")),
                    amount=float(amount_str),
                    iban=str(row.get('Kontonummer/IBAN', "")),
                    confidence=1.0
                )
                transactions.append(tx)
            except Exception as e:
                print(f"DEBUG: Skipping row due to error: {e}")
                continue
            
        return transactions, {}
