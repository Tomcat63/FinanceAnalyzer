import csv
import random
from datetime import datetime, timedelta

# Configuration
target_file = r"c:\Daten\AI Developing\FinanceAnalyzer\my-app\dkb auszug\test_data_mock.csv"
num_records = 300
start_date = datetime(2025, 1, 1)
end_date = datetime.now()

headers = [
    "Buchungsdatum", "Wertstellung", "Status", "Zahlungspflichtige*r",
    "Zahlungsempfänger*in", "Verwendungszweck", "Umsatztyp", "IBAN",
    "Betrag (€)", "Gläubiger-ID", "Mandatsreferenz", "Kundenreferenz"
]

payees_and_purposes = [
    ("REWE", "Einkauf Markt 123", "Kartenzahlung", ["-20,50", "-45,30", "-12,80", "-85,20"]),
    ("Amazon.de", "Bestellung 123-456", "Lastschrift", ["-15,99", "-34,50", "-120,00", "-5,00"]),
    ("Shell", "Tanken", "Kartenzahlung", ["-50,00", "-75,30", "-60,00"]),
    ("Netflix", "Abo Standard", "Lastschrift", ["-13,99"]),
    ("Spotify", "Family Plan", "Lastschrift", ["-17,99"]),
    ("Vermieter GmbH", "Miete Januar", "Dauerauftrag", ["-1200,00"]),
    ("Internet Provider", "DSL & Festnetz", "Lastschrift", ["-39,90"]),
    ("Versicherung AG", "Hausrat", "Lastschrift", ["-15,50"]),
    ("Stadtwerke", "Abschlag Strom", "Lastschrift", ["-85,00"]),
    ("Café Central", "Frühstück", "Kartenzahlung", ["-12,50", "-8,40", "-15,00"]),
    ("Arbeitgeber GmbH", "Gehalt", "Gutschrift", ["2850,00"]),
    ("Lidl", "Wocheneinkauf", "Kartenzahlung", ["-40,00", "-55,00", "-32,00"]),
    ("Deutsche Bahn", "Ticket Fernverkehr", "Kartenzahlung", ["-89,90", "-45,00", "-120,50"]),
    ("Fitnessstudio Fit", "Mitgliedsbeitrag", "Lastschrift", ["-49,90"]),
    ("H&M", "Kleidung", "Kartenzahlung", ["-34,95", "-59,90"]),
]

def generate_random_date(start, end):
    delta = end - start
    random_days = random.randrange(delta.days + 1)
    return start + timedelta(days=random_days)

data = []

# Generate fixed monthly costs
for month in range(1, end_date.month + 1):
    # Rent
    data.append([
        f"01.{month:02d}.2025", f"01.{month:02d}.2025", "Gebucht", "Alex",
        "Vermieter GmbH", f"Miete Monat {month}", "Dauerauftrag", "DE123456789",
        "-1200,00", "", "", ""
    ])
    # Salary
    data.append([
        f"28.{month:02d}.2025" if month != 2 else "27.02.2025", 
        f"28.{month:02d}.2025" if month != 2 else "27.02.2025", 
        "Gebucht", "Employer", "Alex", "Gehalt", "Gutschrift", "DE987654321",
        "2850,00", "", "", ""
    ])
    # Netflix
    data.append([
        f"05.{month:02d}.2025", f"05.{month:02d}.2025", "Gebucht", "Alex",
        "Netflix", "Abo", "Lastschrift", "DE111222333",
        "-13,99", "", "", ""
    ])

# Fill up with random transactions
while len(data) < num_records:
    dt = generate_random_date(start_date, end_date)
    date_str = dt.strftime("%d.%m.%Y")
    payee, purpose, utype, amounts = random.choice(payees_and_purposes)
    amount = random.choice(amounts)
    
    # Avoid duplicate salary/rent fixed entries
    if payee in ["Vermieter GmbH", "Arbeitgeber GmbH", "Netflix"]:
        continue
        
    data.append([
        date_str, date_str, "Gebucht", "Alex",
        payee, purpose, utype, "DE" + "".join([str(random.randint(0,9)) for _ in range(18)]),
        amount, "", "", ""
    ])

# Sort by date
data.sort(key=lambda x: datetime.strptime(x[0], "%d.%m.%Y"), reverse=True)

with open(target_file, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, delimiter=';', quotechar='"', quoting=csv.QUOTE_ALL)
    writer.writerow(headers)
    writer.writerows(data)

print(f"Generated {len(data)} records in {target_file}")
