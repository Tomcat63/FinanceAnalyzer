import sys
import os
import pandas as pd

# Add backend to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from backend.logic.detector import FixedCostDetector, FixedCostCategory
from backend.services import calculate_50_30_20_metrics

def test_detector():
    detector = FixedCostDetector()
    
    test_cases = [
        ("Miete", "Wohnung Januar", -1200.0, True, FixedCostCategory.WOHNEN, 0.85),
        ("Aldi", "Einkauf", -45.0, False, FixedCostCategory.NONE, 0.0),
        ("Netflix", "Abo", -17.99, True, FixedCostCategory.MEDIEN, 0.85),
        ("HUK Coburg", "Versicherung", -89.0, True, FixedCostCategory.VERSICHERUNGEN, 0.85),
        ("Stadtwerke", "Abschlag Strom", -120.0, True, FixedCostCategory.NEBENKOSTEN, 0.85),
        ("Gehalt", "Firma XYZ", 3500.0, True, FixedCostCategory.NONE, 0.0),
        ("Leasing Rate", "BMW Bank", -450.0, True, FixedCostCategory.FINANZIERUNG, 0.85),
        ("Amazon", "Bücher", -35.0, False, FixedCostCategory.NONE, 0.0),
        ("Unbekannt", "Regelmäßig", -50.0, True, FixedCostCategory.SONSTIGES, 0.2)
    ]
    
    print("--- Testing FixedCostDetector ---")
    all_passed = True
    failed_count = 0
    for recipient, purpose, amount, recurring, expected_cat, min_conf in test_cases:
        cat, conf, reason = detector.detect(recipient, purpose, amount, recurring)
        # Use small epsilon for float comparison
        cat_match = cat == expected_cat
        conf_match = conf >= (min_conf - 0.01)  # Allow small tolerance
        passed = cat_match and conf_match
        
        status = "[PASS]" if passed else "[FAIL]"
        if not passed: 
            all_passed = False
            failed_count += 1
        
        print(f"{status} | {recipient:20s} | Cat: {cat.value:15s} (exp: {expected_cat.value:15s}) | Conf: {conf:.2f} (min: {min_conf:.2f})")
        if not passed:
            print(f"       Reason: {reason}")
    
    print(f"\n{'='*80}")
    print(f"Detector Results: {len(test_cases) - failed_count}/{len(test_cases)} tests passed")
    print(f"{'='*80}")
    return all_passed

def test_metrics():
    print("\n--- Testing 50-30-20 Metrics ---")
    data = [
        {"Zahlungsempfänger": "Gehalt", "Betrag": 4000.0, "Fixkosten": False},
        {"Zahlungsempfänger": "Miete", "Betrag": -1000.0, "Fixkosten": True},  # Needs
        {"Zahlungsempfänger": "Strom", "Betrag": -200.0, "Fixkosten": True},   # Needs
        {"Zahlungsempfänger": "Fitness", "Betrag": -50.0, "Fixkosten": True},  # Needs
        {"Zahlungsempfänger": "Kino", "Betrag": -100.0, "Fixkosten": False},   # Wants
        {"Zahlungsempfänger": "Essen", "Betrag": -400.0, "Fixkosten": False},  # Wants
    ]
    df = pd.DataFrame(data)
    metrics = calculate_50_30_20_metrics(df)
    
    # Needs: 1250 (31.25%)
    # Wants: 500 (12.5%)
    # Savings: 2250 (56.25%)
    
    print(f"Income: {metrics['income']}")
    print(f"Needs: {metrics['needs']['amount']} ({metrics['needs']['percentage']}%)")
    print(f"Wants: {metrics['wants']['amount']} ({metrics['wants']['percentage']}%)")
    print(f"Savings: {metrics['savings']['amount']} ({metrics['savings']['percentage']}%)")
    
    if metrics['needs']['amount'] == 1250.0 and metrics['savings']['amount'] == 2250.0:
        print("[PASSED] Metrics calculation is correct")
        return True
    else:
        print("[FAILED] Metrics calculation mismatch")
        return False

if __name__ == "__main__":
    d_ok = test_detector()
    m_ok = test_metrics()
    
    if d_ok and m_ok:
        print("\nALL TESTS PASSED!")
        exit(0)
    else:
        print("\nSOME TESTS FAILED!")
        exit(1)
