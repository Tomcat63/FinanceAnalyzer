import pandas as pd
import io
from .base import BaseParser, InternalTransaction
from typing import List, Optional

class DKBParser(BaseParser):
    @property
    def bank_name(self) -> str:
        return "DKB"

    def parse(self, content: str) -> tuple[List[InternalTransaction], Optional[dict]]:
        # DKB nutzt oft Metadaten-Zeilen. Wir suchen dynamisch nach dem Header.
        lines = content.splitlines()
        header_idx = -1
        metadata = {}
        
        for i, line in enumerate(lines):
            # Try to extract balance metadata
            if "Kontostand" in line:
                try:
                    import re
                    # Sucht nach Beträgen wie 1.234,56 oder 1234,56 (optional mit Minus)
                    match = re.search(r'(-?\d+(?:\.\d+)*,\d+)', line)
                    if match:
                        value_str = match.group(1)
                        metadata["balance"] = float(value_str.replace('.', '').replace(',', '.'))
                        
                        # Label extrahieren: Alles vor dem ersten Semikolon oder dem Betrag
                        label_part = line.split(';')[0].strip('"').replace(':', '').strip()
                        metadata["balance_label"] = label_part
                except Exception as e:
                    print(f"DEBUG: Could not parse balance: {e}")

            if "Buchungsdatum" in line and "Zahlungsempfänger" in line:
                header_idx = i
                break
        
        if header_idx == -1:
            # Fallback: Versuche es trotzdem mit skiprows, falls der Header anders aussieht
            df = pd.read_csv(io.StringIO(content), sep=';', skiprows=range(0, 4))
        else:
            df = pd.read_csv(io.StringIO("\n".join(lines[header_idx:])), sep=';')
        
        transactions = []
        for _, row in df.iterrows():
            # Skip empty rows or rows without a date
            date_val = row.get('Buchungsdatum')
            if pd.isna(date_val) or str(date_val).strip() == "" or str(date_val).lower() == "none":
                continue
                
            # Betrag von "1.234,56" zu float 1234.56 konvertieren
            amount_raw = row.get('Betrag (€)', '0')
            amount_str = str(amount_raw).replace('.', '').replace(',', '.')
            
            try:
                # Datum in ISO Format konvertieren (YYYY-MM-DD)
                iso_date = pd.to_datetime(str(date_val), dayfirst=True).strftime('%Y-%m-%d')
                
                value_date_val = row.get('Wertstellung')
                iso_value_date = None
                if pd.notna(value_date_val) and str(value_date_val).strip():
                    iso_value_date = pd.to_datetime(str(value_date_val), dayfirst=True).strftime('%Y-%m-%d')

                tx = InternalTransaction(
                    date=iso_date,
                    value_date=iso_value_date,
                    recipient=str(row.get('Zahlungsempfänger*in', row.get('Zahlungsempfänger', ''))),
                    sender=str(row.get('Zahlungspflichtige*r', row.get('Zahlungspflichtiger', ''))),
                    purpose=str(row.get('Verwendungszweck', '')),
                    amount=float(amount_str),
                    iban=str(row.get('IBAN', '')),
                    confidence=1.0
                )
                transactions.append(tx)
            except Exception as e:
                print(f"DEBUG: Skipping row due to error: {e}")
                continue
                
        return transactions, metadata
