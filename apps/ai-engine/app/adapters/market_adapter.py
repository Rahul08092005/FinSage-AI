"""Market-data adapter (mock fixture implementation).

Follows the same pattern as SplitwiseAdapter — subclasses
BaseIntegrationAdapter and uses a local fixture instead of calling a real
market-data API (no API key needed in a student project).

Fixture data: 5 well-known Indian mutual fund schemes with fake-but-realistic
NAV values, category, and assumed annual return rates.

get_nav() and calculate_sip_returns() are standalone functions (not methods)
so they can be called independently by tests or other parts of the codebase,
mirroring the calculate_group_balances() pattern in splitwise_adapter.py.
"""
import math
from typing import Any

from app.adapters.base_adapter import BaseIntegrationAdapter


# ---------------------------------------------------------------------------
# Fixture data — fake-but-realistic NAVs & metadata for popular MF schemes
# ---------------------------------------------------------------------------
# NOTE: These are illustrative fixture values for development and testing.
# They do NOT reflect actual NAVs.  In a production system this would be
# replaced by a real market-data feed (e.g. AMFI NAV API).

_FIXTURE_FUNDS: dict[str, dict] = {
    "119598": {
        "scheme_code": "119598",
        "scheme_name": "SBI Bluechip Fund - Direct Plan - Growth",
        "category": "Large Cap",
        "nav": 82.45,
        "nav_date": "2024-09-15",
        "assumed_annual_return": 0.12,   # 12% — illustrative, not guaranteed
    },
    "120503": {
        "scheme_code": "120503",
        "scheme_name": "HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth",
        "category": "Mid Cap",
        "nav": 156.30,
        "nav_date": "2024-09-15",
        "assumed_annual_return": 0.14,
    },
    "118989": {
        "scheme_code": "118989",
        "scheme_name": "Axis Long Term Equity Fund - Direct Plan - Growth",
        "category": "ELSS (Tax Saver)",
        "nav": 95.12,
        "nav_date": "2024-09-15",
        "assumed_annual_return": 0.11,
    },
    "135781": {
        "scheme_code": "135781",
        "scheme_name": "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
        "category": "Flexi Cap",
        "nav": 72.80,
        "nav_date": "2024-09-15",
        "assumed_annual_return": 0.13,
    },
    "120716": {
        "scheme_code": "120716",
        "scheme_name": "ICICI Prudential Liquid Fund - Direct Plan - Growth",
        "category": "Liquid",
        "nav": 345.60,
        "nav_date": "2024-09-15",
        "assumed_annual_return": 0.065,  # 6.5% — conservative, liquid fund
    },
}


# ---------------------------------------------------------------------------
# Standalone functions
# ---------------------------------------------------------------------------


def get_nav(scheme_code: str) -> dict | None:
    """Return NAV info for a mutual fund scheme from the fixture.

    Args:
        scheme_code: The AMFI scheme code (string).

    Returns:
        A dict with scheme_name, category, nav, nav_date, and
        assumed_annual_return — or ``None`` if the scheme code is not in
        the fixture.
    """
    fund = _FIXTURE_FUNDS.get(str(scheme_code))
    if fund is None:
        return None
    # Return a copy so callers don't mutate the fixture
    return dict(fund)


def calculate_sip_returns(
    scheme_code: str,
    monthly_amount: float,
    tenure_months: int,
) -> dict:
    """Project SIP returns for a fixture fund using the standard SIP FV formula.

    Uses the fund's ``assumed_annual_return`` from the fixture (illustrative,
    NOT a guaranteed return).

    Formula:
        FV = P × [((1 + r)^n - 1) / r] × (1 + r)
    where P = monthly_amount, r = annual_return / 12, n = tenure_months.

    Args:
        scheme_code: The AMFI scheme code.
        monthly_amount: Monthly SIP investment amount in INR.
        tenure_months: Investment duration in months.

    Returns:
        {
            "scheme_code": str,
            "scheme_name": str,
            "monthly_amount": float,
            "tenure_months": int,
            "total_invested": float,
            "projected_value": float,
            "projected_returns": float,     # FV - total_invested
            "assumed_annual_return": float,  # the rate used (NOT a guarantee)
        }

    Raises:
        ValueError: If the scheme code is not found in the fixture.
    """
    fund = _FIXTURE_FUNDS.get(str(scheme_code))
    if fund is None:
        raise ValueError(
            f"Scheme code '{scheme_code}' not found in fixture. "
            f"Available codes: {list(_FIXTURE_FUNDS.keys())}"
        )

    monthly_amount = max(0.0, float(monthly_amount))
    tenure_months = max(0, int(tenure_months))
    annual_return = fund["assumed_annual_return"]

    total_invested = round(monthly_amount * tenure_months, 2)

    if tenure_months == 0 or monthly_amount <= 0:
        return {
            "scheme_code": fund["scheme_code"],
            "scheme_name": fund["scheme_name"],
            "monthly_amount": monthly_amount,
            "tenure_months": tenure_months,
            "total_invested": total_invested,
            "projected_value": total_invested,
            "projected_returns": 0.0,
            "assumed_annual_return": annual_return,
        }

    r = annual_return / 12.0  # monthly rate

    if r == 0:
        projected_value = total_invested
    else:
        # Standard SIP future-value formula
        compound = math.pow(1 + r, tenure_months)
        projected_value = monthly_amount * ((compound - 1) / r) * (1 + r)

    projected_value = round(projected_value, 2)
    projected_returns = round(projected_value - total_invested, 2)

    return {
        "scheme_code": fund["scheme_code"],
        "scheme_name": fund["scheme_name"],
        "monthly_amount": monthly_amount,
        "tenure_months": tenure_months,
        "total_invested": total_invested,
        "projected_value": projected_value,
        "projected_returns": projected_returns,
        "assumed_annual_return": annual_return,
    }


def list_available_funds() -> list[dict]:
    """Return a list of all funds in the fixture for discovery / UI dropdowns."""
    return [
        {
            "scheme_code": f["scheme_code"],
            "scheme_name": f["scheme_name"],
            "category": f["category"],
            "nav": f["nav"],
        }
        for f in _FIXTURE_FUNDS.values()
    ]


# ---------------------------------------------------------------------------
# Adapter class
# ---------------------------------------------------------------------------


class MarketDataAdapter(BaseIntegrationAdapter):
    """Mock market-data adapter backed by a local fixture.

    Mirrors the SplitwiseAdapter pattern — swappable for a real market-data
    API client (e.g. AMFI NAV feed, mfapi.in) without changing calling code.
    """

    def fetch_data(self, user_id: str, params: dict) -> dict:
        """Return fixture fund data for ``params['scheme_code']``.

        Falls back to an empty dict if the scheme code is not in the fixture.
        """
        scheme_code = params.get("scheme_code", "")
        fund = get_nav(scheme_code)
        return fund if fund is not None else {}

    def normalize_data(self, raw_data: dict) -> list[dict[str, Any]]:
        """Reshape fund data into a flat list (consistent with adapter interface).

        Returns one dict per fund entry — primarily for health-check / listing
        use-cases; actual SIP calculations use the standalone functions.
        """
        if not raw_data or "scheme_code" not in raw_data:
            return []

        return [{
            "scheme_code": raw_data["scheme_code"],
            "scheme_name": raw_data.get("scheme_name", ""),
            "category": raw_data.get("category", ""),
            "nav": float(raw_data.get("nav", 0)),
            "nav_date": raw_data.get("nav_date", ""),
            "source": "market_fixture",
        }]

    def health_check(self) -> bool:
        """Always True — fixture requires no external dependencies."""
        return True
