from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_chat_stream():
    response = client.post("/answer/", json={"answer": "¿Qué dice el documento?"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")