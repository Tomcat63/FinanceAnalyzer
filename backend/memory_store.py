from typing import List, Dict, Any
import uuid

class InMemoryStore:
    def __init__(self):
        # Struktur: { session_id: [Transactions] }
        self._storage: Dict[str, List[Dict[str, Any]]] = {}

    def save(self, session_id: str, transactions: List[Dict[str, Any]]):
        self._storage[session_id] = transactions

    def get(self, session_id: str) -> List[Dict[str, Any]]:
        return self._storage.get(session_id, [])

    def clear(self, session_id: str):
        if session_id in self._storage:
            del self._storage[session_id]

# Globales Objekt für die gesamte Anwendung
store = InMemoryStore()
