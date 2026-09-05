"""Splitwise adapter (mock fixture implementation).

Follows the same pattern as OCRAdapter -- subclasses BaseIntegrationAdapter
and uses a local fixture instead of calling the real Splitwise API (no API
key in a student project).

Fixture data: 3 groups, each with 3-4 members and a handful of shared
expenses.  fetch_data() returns the fixture group; normalize_data() reshapes
it into standard transaction dicts; health_check() is always True.

calculate_group_balances() is a standalone function (not a method) so it
can be called independently by tests or other parts of the codebase.
"""
from datetime import date
from typing import Any

from app.adapters.base_adapter import BaseIntegrationAdapter

# ---------------------------------------------------------------------------
# Fixture data
# ---------------------------------------------------------------------------

_FIXTURE_GROUPS: dict[str, dict] = {
    "grp_001": {
        "group_id": "grp_001",
        "name": "Flat 4B Expenses",
        "members": ["Rahul", "Aditi", "Kavya"],
        "expenses": [
            {"date": "15/08/2024", "description": "Monthly Rent",
             "amount": 45000.0, "paid_by": "Rahul"},
            {"date": "18/08/2024", "description": "Electricity Bill",
             "amount": 1800.0,  "paid_by": "Aditi"},
            {"date": "20/08/2024", "description": "Grocery Shopping",
             "amount": 3200.0,  "paid_by": "Kavya"},
            {"date": "25/08/2024", "description": "Internet Broadband",
             "amount": 999.0,   "paid_by": "Rahul"},
        ],
    },
    "grp_002": {
        "group_id": "grp_002",
        "name": "Weekend Trip Goa",
        "members": ["Rahul", "Aditi", "Kavya", "Priya"],
        "expenses": [
            {"date": "02/09/2024", "description": "Hotel Booking",
             "amount": 12000.0, "paid_by": "Priya"},
            {"date": "03/09/2024", "description": "Petrol for road trip",
             "amount": 2500.0,  "paid_by": "Rahul"},
            {"date": "03/09/2024", "description": "Restaurant dinner",
             "amount": 3800.0,  "paid_by": "Aditi"},
            {"date": "04/09/2024", "description": "Water sports",
             "amount": 5000.0,  "paid_by": "Kavya"},
        ],
    },
    "grp_003": {
        "group_id": "grp_003",
        "name": "Office Snacks Pool",
        "members": ["Rahul", "Aditi"],
        "expenses": [
            {"date": "01/09/2024", "description": "Tea and biscuits",
             "amount": 450.0,  "paid_by": "Rahul"},
            {"date": "05/09/2024", "description": "Coffee machine pods",
             "amount": 780.0,  "paid_by": "Aditi"},
        ],
    },
}


# ---------------------------------------------------------------------------
# Balance calculation (standalone -- callable by tests independently)
# ---------------------------------------------------------------------------


def calculate_group_balances(group_data: dict) -> dict[str, float]:
    """Compute net balance per member: positive = owed money, negative = owes money.

    Each expense is split equally among all group members.  The payer is
    credited the full amount; every member (including the payer) is debited
    their fair share.

    Internally consistent: the sum of all balances in a group is always 0.0.

    Args:
        group_data: A group dict as returned by SplitwiseAdapter.fetch_data().

    Returns:
        Dict of { member_name: net_balance_float }.
    """
    members  = group_data.get("members", [])
    expenses = group_data.get("expenses", [])
    n        = len(members)

    # Use integer-cent arithmetic to avoid floating-point rounding errors.
    # All amounts are stored as integer paise (1 INR = 100 paise).
    balances_paise: dict[str, int] = {m: 0 for m in members}

    for expense in expenses:
        total_paise = round(float(expense.get("amount", 0)) * 100)
        payer       = expense.get("paid_by", "")

        if n == 0:
            continue

        # Equal share per member (integer division)
        base_share  = total_paise // n
        remainder   = total_paise % n   # leftover paise distributed to payer

        # Credit payer the full amount
        if payer in balances_paise:
            balances_paise[payer] += total_paise

        # Debit every member their base share
        for member in members:
            balances_paise[member] -= base_share

        # Absorb remainder into the payer's balance (they "overpaid" by a paise)
        if payer in balances_paise:
            balances_paise[payer] -= remainder

    # Convert back to INR
    return {m: round(paise / 100, 2) for m, paise in balances_paise.items()}


# ---------------------------------------------------------------------------
# Adapter
# ---------------------------------------------------------------------------


class SplitwiseAdapter(BaseIntegrationAdapter):
    """Mock Splitwise adapter backed by a local fixture.

    Swappable for a real Splitwise API client in a later phase without
    touching any calling code -- same contract as OCRAdapter.
    """

    def fetch_data(self, user_id: str, params: dict) -> dict:
        """Return fixture group data for params[''group_id''].

        Falls back to an empty group dict if the group_id is not in the fixture.
        """
        group_id = params.get("group_id", "")
        return _FIXTURE_GROUPS.get(
            group_id,
            {"group_id": group_id, "name": "Unknown Group", "members": [], "expenses": []},
        )

    def normalize_data(self, raw_data: dict) -> list[dict[str, Any]]:
        """Reshape fixture group data into the standard transaction shape.

        Returns a list so the output is consistent with normalize_batch().
        Each shared expense becomes one transaction dict per group (not per
        member -- the BFF can split further if needed).
        """
        members  = raw_data.get("members", [])
        expenses = raw_data.get("expenses", [])
        normalised = []
        for exp in expenses:
            normalised.append({
                "date":        exp.get("date"),
                "description": exp.get("description", ""),
                "amount":      float(exp.get("amount", 0)),
                "category":    "Shared",
                "source":      "splitwise",
                "paid_by":     exp.get("paid_by", ""),
                "split_among": members,
            })
        return normalised

    def health_check(self) -> bool:
        """Always True -- fixture requires no external dependencies."""
        return True
