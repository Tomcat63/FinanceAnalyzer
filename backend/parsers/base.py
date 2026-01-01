from abc import ABC, abstractmethod
import pandas as pd
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from abc import ABC, abstractmethod

class InternalTransaction(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    date: str = Field(..., alias="Buchungsdatum")
    value_date: Optional[str] = Field(None, alias="Wertstellung")
    recipient: str = Field(..., alias="Zahlungsempfänger")
    sender: str = Field("", alias="Zahlungspflichtiger")
    purpose: str = Field(..., alias="Verwendungszweck")
    amount: float = Field(..., alias="Betrag")
    currency: str = Field("EUR", alias="Währung")
    iban: Optional[str] = Field(None, alias="IBAN")
    category: str = Field("Unkategorisiert", alias="Kategorie")
    confidence: float = 1.0  # Unser Confidence Score
    balance_after: Optional[float] = Field(None, alias="Saldo_Danach")

class BaseParser(ABC):
    @property
    @abstractmethod
    def bank_name(self) -> str:
        pass

    @abstractmethod
    def parse(self, content: str) -> tuple[List[InternalTransaction], Optional[dict]]:
        pass
