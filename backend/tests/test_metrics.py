import pandas as pd
import pytest
from backend.services import calculate_50_30_20_metrics

def test_metrics_calculation_standard():
    """Verify standard 50-30-20 calculation with exact matches."""
    data = {
        'Betrag': [2000.0, -1000.0, -600.0], # 2000 Income, 1000 Fix (Need), 600 Want
        'Fixkosten': [False, True, False],
    }
    df = pd.DataFrame(data)
    metrics = calculate_50_30_20_metrics(df)
    
    assert metrics['income'] == pytest.approx(2000.0)
    assert metrics['needs']['amount'] == pytest.approx(1000.0)
    assert metrics['needs']['percentage'] == pytest.approx(50.0)
    assert metrics['wants']['amount'] == pytest.approx(600.0)
    assert metrics['wants']['percentage'] == pytest.approx(30.0)
    assert metrics['savings']['amount'] == pytest.approx(400.0)
    assert metrics['savings']['percentage'] == pytest.approx(20.0)

def test_metrics_empty_data():
    """Verify handle empty dataframe gracefully."""
    df = pd.DataFrame(columns=['Betrag', 'Fixkosten'])
    metrics = calculate_50_30_20_metrics(df)
    assert metrics == {}

def test_metrics_no_income():
    """Verify handle zero income gracefully."""
    data = {
        'Betrag': [-100.0, -200.0],
        'Fixkosten': [True, False],
    }
    df = pd.DataFrame(data)
    metrics = calculate_50_30_20_metrics(df)
    assert "error" in metrics
    assert "Keine Einnahmen" in metrics['error']

def test_metrics_rounding_precision():
    """Verify precision with complex decimals."""
    # 2345.67 Income
    # 1234.56 Needs (52.631...%)
    income = 2345.67
    needs = 1234.56
    expected_perc = (needs / income) * 100
    
    data = {
        'Betrag': [income, -needs],
        'Fixkosten': [False, True],
    }
    df = pd.DataFrame(data)
    metrics = calculate_50_30_20_metrics(df)
    
    # percentage is rounded to 1 decimal in service
    assert metrics['needs']['percentage'] == pytest.approx(round(expected_perc, 1))
