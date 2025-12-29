import pytest
from fastapi.testclient import TestClient
from main import app
import io
import pandas as pd

client = TestClient(app)

def test_upload_recurring_and_single():
    # Simulate 3 months of rent and one single transaction
    # Format: Buchungsdatum;Zahlungsempfänger;Verwendungszweck;Betrag
    csv_content = (
        "Buchungsdatum;Zahlungsempfänger*in;Verwendungszweck;Betrag\n"
        "01.10.2023;Vermieter Meyer;Miete Oktober;-850,00\n"
        "01.11.2023;Vermieter Meyer;Miete November;-850,00\n"
        "01.12.2023;Vermieter Meyer;Miete Dezember;-850,00\n"
        "15.12.2023;REWE sagt Danke;Einkauf;-25,50\n"
    )
    
    file = io.BytesIO(csv_content.encode('utf-8'))
    response = client.post("/upload", files={"file": ("test.csv", file, "text/csv")})
    
    assert response.status_code == 200
    data = response.json()
    
    transactions = data["transactions"]
    assert len(transactions) == 4
    
    # Check rent (should be fixed cost and recurring)
    # Note: Search is descending order by date in main.py
    dec_rent = next(t for t in transactions if "Dezember" in t["Verwendungszweck"])
    assert dec_rent["Kategorie"] == "Wohnen"
    assert dec_rent["Fixkosten"] is True
    assert dec_rent["Wiederkehrend"] is True
    assert dec_rent["Betrag"] == -850.0
    
    # Check REWE
    rewe = next(t for t in transactions if "REWE" in t["Zahlungsempfänger"])
    assert rewe["Kategorie"] == "Essen"
    assert rewe["Fixkosten"] is False
    assert rewe["Wiederkehrend"] is False
    assert rewe["Betrag"] == -25.5

if __name__ == "__main__":
    pytest.main([__file__])
