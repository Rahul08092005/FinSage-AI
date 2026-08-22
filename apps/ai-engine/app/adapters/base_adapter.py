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
