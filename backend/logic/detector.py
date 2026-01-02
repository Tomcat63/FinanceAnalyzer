from enum import Enum
from typing import Dict, List, Optional, Tuple
import pandas as pd

class FixedCostCategory(Enum):
    WOHNEN = "Wohnen"
    VERSICHERUNGEN = "Versicherungen"
    MEDIEN = "Medien"
    NEBENKOSTEN = "Nebenkosten"
    FINANZIERUNG = "Finanzierung"
    SONSTIGES = "Sonstiges"
    NONE = "Keine"

class FixedCostDetector:
    def __init__(self):
        # Configuration for plausibility thresholds (Avoid "Magic Numbers")
        self.max_plausible_amounts = {
            FixedCostCategory.WOHNEN: 3000.0,
            FixedCostCategory.VERSICHERUNGEN: 500.0,
            FixedCostCategory.MEDIEN: 100.0,
            FixedCostCategory.NEBENKOSTEN: 500.0,
            FixedCostCategory.FINANZIERUNG: 2000.0,
            FixedCostCategory.SONSTIGES: 1000.0
        }

        # Keyword mapping for categories
        # CRITICAL: All keywords must be lowercase for matching to work!
        self.keywords = {
            FixedCostCategory.WOHNEN: ["lbs sued", "santander", "weg", "miete", "vermieter", "hausverwaltung", "hypothek", "wohngeld"],
            FixedCostCategory.VERSICHERUNGEN: ["versicherung", "huk", "allianz", "krankenkasse", "beitrag service", "dekra", "cosmos"],
            FixedCostCategory.MEDIEN: ["netflix", "spotify", "disney", "prime", "sky", "telekom", "vodafone", "o2", "gez", "rundfunk"],
            FixedCostCategory.NEBENKOSTEN: ["strom", "gas", "wasser", "müll", "abfall", "stadtwerke", "eon", "vattenfall"],     
            FixedCostCategory.FINANZIERUNG: ["darlehen", "kredit", "leasing", "finanzierung", "rate", "tilgung", "zinsen", "zins"]
        }

        # Exclusion list (e.g. Income should NEVER be a fixed cost expense)
        self.exclusions = ["gehalt", "lohn", "bezüge", "rente", "gutschrift", "bonus"]

    def detect(self, recipient: str, purpose: str, amount: float, is_recurring: bool = False) -> Tuple[FixedCostCategory, float, str]:
        """
        Detects if a transaction is a fixed cost and assigns a category and confidence.
        Returns: (Category, Confidence Score, Reason)
        """
        # Bank-agnostic processing: text normalized
        text = f"{str(recipient).lower()} {str(purpose).lower()}"
        amount_abs = abs(amount)

        # Rule 0: Exclusions (Income)
        if any(ex in text for ex in self.exclusions) or amount > 0:
            return FixedCostCategory.NONE, 0.0, "Einkommen/Gutschrift ausgeschlossen"

        detected_category = FixedCostCategory.NONE
        confidence = 0.0
        reasons = []

        # Rule 1: Keyword Matching
        print(f"DEBUG: Analyzing '{text}' for keywords...")
        for category, kws in self.keywords.items():
            for kw in kws:
                if kw in text:
                    print(f"  -> MATCH: Found '{kw}' -> Category: {category.value}")
                    detected_category = category
                    confidence += 0.5
                    reasons.append(f"Keyword-Treffer ({category.value}: '{kw}')")
                    break
            if detected_category != FixedCostCategory.NONE:
                break

        if detected_category == FixedCostCategory.NONE:
            # Fallback for recurring but no specific keyword
            if is_recurring:
                detected_category = FixedCostCategory.SONSTIGES
                confidence += 0.3
                reasons.append("Wiederkehrendes Muster ohne Kategorie-Zuordnung")
        else:
            # Rule 2: Reliability Boost (is_recurring)
            if is_recurring:
                confidence += 0.3
                reasons.append("Frequenzanalyse bestätigt Regelmäßigkeit (+0.3)")

        # Rule 3: Plausibility Check (Thresholds)
        if detected_category != FixedCostCategory.NONE and detected_category != FixedCostCategory.SONSTIGES:
            limit = self.max_plausible_amounts.get(detected_category, 1000.0)
            if amount_abs <= limit:
                confidence += 0.2
                reasons.append(f"Betrag plausibel (<= {limit}€)")
            else:
                # Penalty for implausible amount (could be a one-time purchase as TV)
                confidence -= 0.3
                reasons.append(f"Betrag unplausibel hoch (> {limit}€) - Punktabzug")

        # Cap confidence
        confidence = max(0.0, min(1.0, confidence))
        
        reason_str = ", ".join(reasons) if reasons else "Keine Hinweise auf Fixkosten"
        return detected_category, confidence, reason_str

    def process_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Bulk processing for DataFrames.
        Assumes columns: 'Zahlungsempfänger', 'Verwendungszweck', 'Betrag', 'Wiederkehrend'
        """
        results = []
        for _, row in df.iterrows():
            cat, conf, reason = self.detect(
                recipient=row.get('Zahlungsempfänger', ''),
                purpose=row.get('Verwendungszweck', ''),
                amount=row.get('Betrag', 0.0),
                is_recurring=row.get('Wiederkehrend', False)
            )
            results.append({
                'Fixkosten_Kategorie': cat.value,
                'Fixkosten_Confidence': conf,
                'Fixkosten_Grund': reason,
                'Fixkosten_Status': conf >= 0.5  # Threshold for 'True'
            })
        
        results_df = pd.DataFrame(results)
        return pd.concat([df.reset_index(drop=True), results_df], axis=1)
