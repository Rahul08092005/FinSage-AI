"""Person 3 (Kavya) owns this file.

Phase 1: parse a bank/UPI-style CSV export into a normalized transaction
DataFrame. This is the first stage of the "different sources -> one
Transaction structure" pipeline described in the architecture doc.
"""
import io

import pandas as pd

EXPECTED_COLUMNS = ["date", "description", "amount", "category"]


def parse_transactions_csv(csv_bytes: bytes) -> pd.DataFrame:
    df = pd.read_csv(io.BytesIO(csv_bytes))

    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing required columns: {missing}")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["date", "amount"])

    return df[EXPECTED_COLUMNS]
