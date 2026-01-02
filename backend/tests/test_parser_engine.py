from backend.parsers.factory import ParserFactory
import pandas as pd

def test_parser():
    # Mock DKB CSV Content
    csv_content = """Buchungsdatum;Wertstellung;Status;Zahlungspflichtige*r;Zahlungsempfänger*in;Verwendungszweck;Umsatztyp;IBAN;Betrag (€);Gläubiger-ID;Mandatsreferenz;Kundenreferenz
                     01.01.2025;01.01.2025;Gebucht;Alex;Vermieter GmbH;Miete Januar;Dauerauftrag;DE123456789;-1200,00;G12345;REF123;KUND123
                  """
    try:
        parser = ParserFactory.get_parser(csv_content)
        print(f"Erkannter Parser: {parser.bank_name}")
        
        transactions = parser.parse(csv_content)
        for tx in transactions:
            print(f"Transaktion: {tx.buchungsdatum} | {tx.zahlungsempfang} | {tx.betrag} € | Gläubiger: {tx.glaubiger_id}")
            
        print("Test erfolgreich!")
    except Exception as e:
        print(f"Test fehlgeschlagen: {str(e)}")

if __name__ == "__main__":
    test_parser()
