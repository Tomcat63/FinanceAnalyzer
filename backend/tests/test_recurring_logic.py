import pandas as pd
import pytest
from backend.services import detect_recurring_patterns

def test_recurring_pattern_standard_interval():
    """Test standard 30-day interval detection."""
    data = {
        'Buchungsdatum': ['2023-01-01', '2023-01-31', '2023-03-02'],
        'Zahlungsempfänger': ['Test Corp', 'Test Corp', 'Test Corp'],
        'Betrag': [-50.0, -50.0, -50.0],
        'Verwendungszweck': ['Rent', 'Rent', 'Rent']
    }
    df = pd.DataFrame(data)
    df = detect_recurring_patterns(df)
    
    assert df['Wiederkehrend'].all()

def test_recurring_pattern_month_transition_jan_feb():
    """Test transition from Jan 31 to Feb 28 (short month)."""
    # 28 days interval fits in the 27-34 day logic
    data = {
        'Buchungsdatum': ['2023-01-31', '2023-02-28'],
        'Zahlungsempfänger': ['Landlord', 'Landlord'],
        'Betrag': [-1000.0, -1000.0],
        'Verwendungszweck': ['Miete', 'Miete']
    }
    df = pd.DataFrame(data)
    df = detect_recurring_patterns(df)
    
    assert df['Wiederkehrend'].all(), "Should detect transition from Jan 31 to Feb 28 as recurring"

def test_recurring_pattern_not_recurring():
    """Test that irregular payments are not marked as recurring."""
    data = {
        'Buchungsdatum': ['2023-01-01', '2023-01-10', '2023-02-15'],
        'Zahlungsempfänger': ['Shop', 'Shop', 'Shop'],
        'Betrag': [-20.0, -20.0, -20.0],
        'Verwendungszweck': ['Food', 'Food', 'Food']
    }
    df = pd.DataFrame(data)
    df = detect_recurring_patterns(df)
    
    assert not df['Wiederkehrend'].any()

def test_recurring_pattern_different_amounts():
    """Test that same payee but different amounts are handled separately (current logic)."""
    data = {
        'Buchungsdatum': ['2023-01-01', '2023-01-31'],
        'Zahlungsempfänger': ['Vattenfall', 'Vattenfall'],
        'Betrag': [-50.0, -60.0],
        'Verwendungszweck': ['Power', 'Power']
    }
    df = pd.DataFrame(data)
    df = detect_recurring_patterns(df)
    
    assert not df['Wiederkehrend'].any(), "Amounts must match exactly in current implementation"
