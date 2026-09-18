"""Indian tax-savings calculator and SIP suggestion utilities.

Deterministic functions — no LLM calls, no external dependencies.

DISCLAIMER: These calculations are illustrative and educational only.
They are NOT definitive tax or investment advice. Consult a qualified
chartered accountant or SEBI-registered investment advisor before making
financial decisions.
"""
import math


# ---------------------------------------------------------------------------
# Step 1 — Tax-savings calculator
# ---------------------------------------------------------------------------

# ---------- FY 2024-25 (Assessment Year 2025-26) OLD REGIME SLABS ----------
# Source assumption: Income Tax Act, 1961 — pre-existing / old regime slabs
# as commonly published for FY 2024-25.  Standard deduction for salaried
# individuals is Rs. 50,000 under the old regime.
#
# Slab (taxable income)          Rate
# Up to Rs. 2,50,000             Nil
# Rs. 2,50,001 – Rs. 5,00,000   5 %
# Rs. 5,00,001 – Rs. 10,00,000  20 %
# Above Rs. 10,00,000            30 %
#
# Section 80C deduction: max Rs. 1,50,000 (investments in PPF, ELSS, etc.)
# Health & Education Cess: 4 % on total tax payable.
# --------------------------------------------------------------------------

_OLD_REGIME_SLABS: list[tuple[float, float, float]] = [
    # (upper_limit, rate, tax_on_previous_slabs)
    # We use a cumulative-bracket approach for clarity.
    (250_000,   0.00, 0.0),
    (500_000,   0.05, 0.0),
    (1_000_000, 0.20, 12_500.0),
    (float("inf"), 0.30, 112_500.0),
]

_OLD_REGIME_STANDARD_DEDUCTION = 50_000.0   # salaried standard deduction
_SECTION_80C_LIMIT = 150_000.0              # max 80C deduction


# -------- FY 2024-25 (AY 2025-26) NEW REGIME SLABS (post-Budget 2024) --------
# Source assumption: Finance Act 2024, Section 115BAC — revised new tax
# regime slabs effective from FY 2024-25.  Standard deduction Rs. 75,000.
# Most deductions (including 80C) do NOT apply under the new regime.
#
# Slab (taxable income)           Rate
# Up to Rs. 3,00,000              Nil
# Rs. 3,00,001 – Rs. 7,00,000    5 %
# Rs. 7,00,001 – Rs. 10,00,000   10 %
# Rs. 10,00,001 – Rs. 12,00,000  15 %
# Rs. 12,00,001 – Rs. 15,00,000  20 %
# Above Rs. 15,00,000             30 %
#
# Health & Education Cess: 4 % on total tax payable.
# ---------------------------------------------------------------------------

_NEW_REGIME_SLABS: list[tuple[float, float, float]] = [
    (300_000,      0.00, 0.0),
    (700_000,      0.05, 0.0),
    (1_000_000,    0.10, 20_000.0),
    (1_200_000,    0.15, 50_000.0),
    (1_500_000,    0.20, 80_000.0),
    (float("inf"), 0.30, 140_000.0),
]

_NEW_REGIME_STANDARD_DEDUCTION = 75_000.0   # Budget 2024 increase


def _compute_tax(taxable_income: float, slabs: list[tuple[float, float, float]]) -> float:
    """Compute tax payable on *taxable_income* using the given slab table.

    Each slab entry is (upper_limit, marginal_rate, cumulative_tax_from_prior_slabs).
    Health & Education Cess of 4% is added on top.

    This is a helper — not exported.  The slab tables above document the
    source assumptions for every constant used here.
    """
    if taxable_income <= 0:
        return 0.0

    tax = 0.0
    prev_limit = 0.0

    for upper, rate, _cumulative in slabs:
        if taxable_income <= upper:
            tax += (taxable_income - prev_limit) * rate
            break
        else:
            tax += (upper - prev_limit) * rate
            prev_limit = upper

    # 4% Health & Education Cess on computed tax
    cess = tax * 0.04
    return round(tax + cess, 2)


def calculate_tax_savings(
    income: float,
    current_80c_investments: float,
    regime: str = "old",
) -> dict:
    """Compute illustrative income-tax payable under the chosen regime.

    For the **old regime**: computes tax before and after applying Section 80C
    deductions (capped at Rs. 1,50,000) so the caller can show the savings
    side-by-side.

    For the **new regime**: most deductions (including 80C) don't apply, so
    ``tax_after_80c`` equals ``tax_before_80c`` and ``savings`` is 0.

    Both regimes include standard deduction for salaried individuals and
    4% Health & Education Cess.

    IMPORTANT: This is an illustrative calculation based on FY 2024-25
    (AY 2025-26) slab assumptions documented inline.  It is NOT definitive
    tax advice — consult a qualified CA for actual filing.

    Args:
        income: Gross annual income (salary) in INR.
        current_80c_investments: Total qualifying 80C investments already made
                                 (PPF, ELSS, LIC premium, etc.) in INR.
        regime: ``'old'`` or ``'new'`` — selects the slab structure.

    Returns:
        {
            "regime": str,
            "tax_before_80c": float,   # tax without 80C deduction
            "tax_after_80c": float,    # tax with 80C deduction (old) or same (new)
            "savings": float,          # difference
            "remaining_80c_room": float,  # how much more 80C room is left
        }
    """
    income = max(0.0, float(income))
    current_80c = max(0.0, float(current_80c_investments))
    regime = regime.strip().lower()

    if regime == "new":
        # --- New Regime ---
        # Standard deduction for salaried: Rs. 75,000 (Budget 2024)
        taxable_before = max(0.0, income - _NEW_REGIME_STANDARD_DEDUCTION)

        tax_before = _compute_tax(taxable_before, _NEW_REGIME_SLABS)

        # 80C does NOT apply under the new regime
        return {
            "regime": "new",
            "tax_before_80c": tax_before,
            "tax_after_80c": tax_before,       # same — no 80C benefit
            "savings": 0.0,
            "remaining_80c_room": 0.0,         # not applicable
        }

    # --- Old Regime (default) ---
    # Standard deduction for salaried: Rs. 50,000
    taxable_before_80c = max(0.0, income - _OLD_REGIME_STANDARD_DEDUCTION)

    tax_before = _compute_tax(taxable_before_80c, _OLD_REGIME_SLABS)

    # Apply Section 80C deduction (capped at Rs. 1,50,000)
    effective_80c = min(current_80c, _SECTION_80C_LIMIT)
    taxable_after_80c = max(0.0, taxable_before_80c - effective_80c)

    tax_after = _compute_tax(taxable_after_80c, _OLD_REGIME_SLABS)

    savings = round(tax_before - tax_after, 2)
    remaining_room = round(max(0.0, _SECTION_80C_LIMIT - current_80c), 2)

    return {
        "regime": "old",
        "tax_before_80c": tax_before,
        "tax_after_80c": tax_after,
        "savings": savings,
        "remaining_80c_room": remaining_room,
    }


# ---------------------------------------------------------------------------
# Step 2 — SIP suggestion calculator
# ---------------------------------------------------------------------------


def calculate_sip_suggestion(
    monthly_surplus: float,
    goal_amount: float,
    months_remaining: int,
    expected_annual_return: float = 0.10,
) -> dict:
    """Compute the required monthly SIP to reach a savings goal.

    Uses the standard SIP future-value formula:

        FV = P × [((1 + r)^n - 1) / r] × (1 + r)

    where:
        P = monthly SIP installment
        r = expected_annual_return / 12  (monthly rate)
        n = months_remaining

    Solves for P given FV = goal_amount, then compares against the user's
    ``monthly_surplus`` to assess feasibility.

    NOTE: ``expected_annual_return`` is a user-adjustable assumption and does
    NOT represent a guaranteed return.  Actual returns depend on market
    conditions, fund selection, and other factors.  This is an illustrative
    projection, not investment advice.

    Args:
        monthly_surplus: How much the user can spare each month (INR).
        goal_amount: Target corpus / goal value (INR).
        months_remaining: Number of months until the goal deadline.
        expected_annual_return: Assumed annual rate of return (default 10%,
                                i.e. 0.10).  User-adjustable, not a guarantee.

    Returns:
        {
            "required_monthly_sip": float,
            "is_feasible": bool,            # True if required <= surplus
            "shortfall_or_surplus": float,  # positive = surplus, negative = shortfall
        }
    """
    monthly_surplus = max(0.0, float(monthly_surplus))
    goal_amount = max(0.0, float(goal_amount))
    months_remaining = max(0, int(months_remaining))
    expected_annual_return = max(0.0, float(expected_annual_return))

    if months_remaining == 0 or goal_amount <= 0:
        # Edge case: no time left or nothing to save for
        return {
            "required_monthly_sip": 0.0,
            "is_feasible": goal_amount <= 0,
            "shortfall_or_surplus": round(monthly_surplus, 2),
        }

    r = expected_annual_return / 12.0   # monthly rate

    if r == 0:
        # No returns assumed — simple division
        required_sip = goal_amount / months_remaining
    else:
        # Standard SIP FV formula rearranged to solve for P:
        #   P = FV / [((1+r)^n - 1) / r × (1+r)]
        compound = math.pow(1 + r, months_remaining)
        fv_factor = ((compound - 1) / r) * (1 + r)
        required_sip = goal_amount / fv_factor

    required_sip = round(required_sip, 2)
    diff = round(monthly_surplus - required_sip, 2)

    return {
        "required_monthly_sip": required_sip,
        "is_feasible": diff >= 0,
        "shortfall_or_surplus": diff,
    }
