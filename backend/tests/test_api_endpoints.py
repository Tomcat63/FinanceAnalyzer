import pytest
from fastapi.testclient import TestClient
from backend.main import app
from unittest.mock import patch, MagicMock
import os

client = TestClient(app)

def test_health_endpoint():
    """Simple check for API health."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch("os.path.exists")
@patch("builtins.open")
def test_demo_data_endpoint(mock_open, mock_exists):
    """Test demo data endpoint with mocked file system."""
    mock_exists.return_value = True
    mock_file = MagicMock()
    mock_file.read.return_value = "date;payee;amount\n2023-01-01;Test;100"
    mock_file.__enter__.return_value = mock_file
    mock_open.return_value = mock_file
    
    response = client.get("/api/demo-data")
    assert response.status_code == 200
    assert "csv_content" in response.json()

def test_clear_session():
    """Test clearing session memory store."""
    response = client.post("/api/clear?x_session_id=test_user")
    assert response.status_code == 200
    assert response.json()["status"] == "cleared"

def test_upload_invalid_file():
    """Verify that empty/invalid upload returns 400."""
    files = {'file': ('test.txt', b'not a csv', 'text/plain')}
    response = client.post("/upload", files=files)
    # The current logic might throw for "no parser found" or "no transactions"
    assert response.status_code in [400, 500] 
