import pytest
from fastapi.testclient import TestClient
from main import app
import io

client = TestClient(app)

def test_upload_dkb():
    # Simulate DKB format (requires metadata lines then header)
    csv_content = (
        "Metadata line 1\nMetadata line 2\nMetadata line 3\nMetadata line 4\n"
        "Buchungsdatum;Wertstellung;Zahlungsempfänger*in;Zahlungspflichtige*r;Verwendungszweck;Betrag (€);IBAN;Gläubiger-ID\n"
        "01.10.2023;01.10.2023;Vermieter Meyer;;Miete Oktober;-850,00;DE11;DE123\n"
        "01.11.2023;01.11.2023;Vermieter Meyer;;Miete November;-850,00;DE11;DE123\n"
        "01.12.2023;01.12.2023;Vermieter Meyer;;Miete Dezember;-850,00;DE11;DE123\n"
        "15.12.2023;15.12.2023;REWE sagt Danke;;Einkauf;-25,50;DE22;\n"
    )
    
    file = io.BytesIO(csv_content.encode('utf-8'))
    response = client.post("/upload", files={"file": ("test_dkb.csv", file, "text/csv")})
    
    if response.status_code != 200:
        print(f"DKB Error: {response.json()}")
    
    assert response.status_code == 200
    data = response.json()
    
    transactions = data["transactions"]
    assert len(transactions) == 4
    assert data["bank"] == "DKB"
    
    # Check rent
    dec_rent = next(t for t in transactions if "Dezember" in t["Verwendungszweck"])
    assert dec_rent["Kategorie"] == "Wohnen"
    assert dec_rent["Fixkosten"] is True
    assert dec_rent["Wiederkehrend"] is True
    assert dec_rent["Buchungsdatum"] == "2023-12-01"
    assert dec_rent["Betrag"] == -850.0

def test_upload_sparkasse():
    # Simulate Sparkasse format (requires Buchungstag and Begünstigter/Zahlungspflichtiger)
    csv_content = (
        "Buchungstag;Begünstigter/Zahlungspflichtiger;Verwendungszweck;Betrag;Kontonummer/IBAN;Gläubiger ID\n"
        "01.10.2023;Vermieter Meyer;Miete Oktober;-850,00;DE11;DE123\n"
        "15.12.2023;Amazon;Bestellung 1;-25,50;DE22;\n"
    )
    
    file = io.BytesIO(csv_content.encode('utf-8'))
    response = client.post("/upload", files={"file": ("test_sparkasse.csv", file, "text/csv")})
    
    assert response.status_code == 200
    data = response.json()
    
    transactions = data["transactions"]
    assert len(transactions) == 2
    assert data["bank"] == "Sparkasse"
    
    amazon = next(t for t in transactions if "Amazon" in t["Zahlungsempfänger"])
    assert amazon["Kategorie"] == "Amazon"
    assert amazon["Betrag"] == -25.5

def test_upload_invalid():
    csv_content = "Invalid;Header\nData;Row"
    file = io.BytesIO(csv_content.encode('utf-8'))
    response = client.post("/upload", files={"file": ("test_invalid.csv", file, "text/csv")})
    
    assert response.status_code == 400
    assert "detail" in response.json()

if __name__ == "__main__":
    pytest.main([__file__])
