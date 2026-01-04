import pytest
from backend.logic.detector import FixedCostDetector, FixedCostCategory

@pytest.fixture
def detector():
    return FixedCostDetector()

@pytest.mark.parametrize("recipient,purpose,expected_category", [
    ("Miete Max Mustermann", "Wohnung Jan", FixedCostCategory.WOHNEN),
    ("MIETE", "Home", FixedCostCategory.WOHNEN),
    ("miete", "", FixedCostCategory.WOHNEN),
    ("Netflix.com", "Subscription", FixedCostCategory.MEDIEN),
    ("NETFLIX", "Video", FixedCostCategory.MEDIEN),
    ("HUK Coburg", "Auto", FixedCostCategory.VERSICHERUNGEN),
    ("Kreditrate", "Haus", FixedCostCategory.FINANZIERUNG),
    ("Gehalt", "Bonus", FixedCostCategory.NONE),  # Exclusion test
])
def test_fixed_cost_keyword_matching(detector, recipient, purpose, expected_category):
    """Verify that different casings and keywords map to correct categories."""
    cat, _, _ = detector.detect(recipient, purpose, -500.0)
    assert cat == expected_category

def test_fixed_cost_plausibility_penalty(detector):
    """Verify that implausibly high amounts reduce confidence."""
    # Media limit is 100 EUR
    _, conf_low, _ = detector.detect("Netflix", "", -500.0)
    _, conf_high, _ = detector.detect("Netflix", "", -15.0)
    
    assert conf_low < conf_high

def test_fixed_cost_income_exclusion(detector):
    """Verify that positive amounts or income keywords are never fixed costs."""
    # Even if it contains "miete", if it's positive (refund), it's not a fixed cost expense
    cat, conf, _ = detector.detect("Miete Rückzahlung", "", 100.0)
    assert cat == FixedCostCategory.NONE
    assert conf == 0.0
