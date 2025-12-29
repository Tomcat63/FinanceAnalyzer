import pandas as pd
import io
import json

def detect_recurring_patterns(df):
    if df.empty:
        return df

    df['temp_date'] = pd.to_datetime(df['Buchungsdatum'], errors='coerce')
    df = df.sort_values(['Zahlungsempfänger', 'Betrag', 'temp_date'])
    df['Wiederkehrend'] = False
    groups = df.groupby(['Zahlungsempfänger', 'Betrag'])
    
    for (payee, amount), group in groups:
        if len(group) < 2:
            continue
        diffs = group['temp_date'].diff().dt.days
        is_monthly = diffs.apply(lambda x: 27 <= x <= 34 if pd.notna(x) else False).any()
        if is_monthly:
            df.loc[group.index, 'Wiederkehrend'] = True
    df = df.drop(columns=['temp_date'])
    return df

# Mock data over multiple months
mock_csv = """Buchungsdatum;Zahlungsempfänger;Verwendungszweck;Betrag
01.10.2023;Internet Provider;Rechnung Oct;-39,90
01.11.2023;Internet Provider;Rechnung Nov;-39,90
01.12.2023;Internet Provider;Rechnung Dec;-39,90
15.10.2023;Supermarkt;Einkauf;-25,50
18.10.2023;Supermarkt;Einkauf;-32,10
15.11.2023;Supermarkt;Einkauf;-25,50
"""

def test_recurring():
    df = pd.read_csv(io.StringIO(mock_csv), sep=';')
    
    # Pre-process amounts like in main.py
    def parse_german_amount(val):
        try:
            return float(str(val).replace('.', '').replace(',', '.'))
        except:
            return 0.0
    df['Betrag'] = df['Betrag'].apply(parse_german_amount)
    
    df = detect_recurring_patterns(df)
    
    # We expect Internet Provider to be recurring because of ~30 day gaps
    # We expect Supermarkt to be recurring because of 31 day gap for the 25.50 amount
    
    result = df.to_dict(orient='records')
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_recurring()
