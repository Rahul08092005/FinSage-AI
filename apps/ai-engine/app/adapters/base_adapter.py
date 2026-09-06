<<<<<<< HEAD
"""Person 3 (Kavya) owns this file.

Every external integration (OCR, Splitwise, Bank/AA, Market data — Phase 5)
implements this interface so Person 4's frontend never cares which provider
is behind it, and a provider outage can never block the team's progress.
"""
=======
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
from abc import ABC, abstractmethod


class BaseIntegrationAdapter(ABC):
    @abstractmethod
    def fetch_data(self, user_id: str, params: dict) -> dict:
        raise NotImplementedError

    @abstractmethod
    def normalize_data(self, raw_data: dict) -> dict:
        raise NotImplementedError

    @abstractmethod
    def health_check(self) -> bool:
        raise NotImplementedError
