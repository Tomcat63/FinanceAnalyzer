
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class InternalTransaction(BaseModel):
    """
    Standardisiertes Datenmodell für alle Banktransaktionen.
    Dient als Single Source of Truth für das Frontend.
    """
    buchungsdatum: date = Field(..., alias="Buchungsdatum")
    wertstellung: Optional[date] = Field(None, alias="Wertstellung")
    zahlungsempfang: str = Field(..., alias="Zahlungsempfänger")
    verwendungszweck: str = Field("", alias="Verwendungszweck")
    betrag: float = Field(..., alias="Betrag")
    waehrung: str = Field("EUR", alias="Währung")
    kategorie: str = Field("Sonstiges", alias="Kategorie")
    fixkosten: bool = Field(False, alias="Fixkosten")
    wiederkehrend: bool = Field(False, alias="Wiederkehrend")
    confidence_score: float = Field(1.0, alias="ConfidenceScore")
    iban: Optional[str] = Field(None, alias="IBAN")
    glaubiger_id: Optional[str] = Field(None, alias="GläubigerID")

    class Config:
        populate_by_name = True
        json_encoders = {
            date: lambda v: v.strftime("%Y-%m-%d")
        }

class ParserResponse(BaseModel):
    count: int
    transactions: List[InternalTransaction]
    bank_name: str
    parsing_errors: List[str] = []
