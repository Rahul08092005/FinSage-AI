"""Parse CSV transaction files into normalized pandas DataFrames."""
import io
import pandas as pd

CHUNK_THRESHOLD = 5000
CHUNK_SIZE = 5000
EXPECTED_COLUMNS = ["date", "description", "amount", "category"]


def parse_transactions_csv(csv_bytes: bytes) -> pd.DataFrame:
    """Parse CSV transaction bytes into a normalized DataFrame.

    For large datasets (> 5,000 rows), processes in chunks using pandas chunksize
    to minimize memory spikes, concatenating sanitized chunks at the end.
    """
    estimated_rows = csv_bytes.count(b"\n")

    if estimated_rows > CHUNK_THRESHOLD:
        chunks: list[pd.DataFrame] = []
        first_chunk = True
        for chunk in pd.read_csv(io.BytesIO(csv_bytes), chunksize=CHUNK_SIZE):
            if first_chunk:
                missing = [c for c in EXPECTED_COLUMNS if c not in chunk.columns]
                if missing:
                    raise ValueError(f"CSV is missing required columns: {missing}")
                first_chunk = False

            chunk["date"] = pd.to_datetime(chunk["date"], errors="coerce")
            chunk["amount"] = pd.to_numeric(chunk["amount"], errors="coerce")
            chunk = chunk.dropna(subset=["date", "amount"])
            chunks.append(chunk[EXPECTED_COLUMNS])

        if not chunks:
            return pd.DataFrame(columns=EXPECTED_COLUMNS)
        return pd.concat(chunks, ignore_index=True)

    # Standard fast path for typical smaller CSVs (<= 5,000 rows)
    df = pd.read_csv(io.BytesIO(csv_bytes))

    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing required columns: {missing}")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["date", "amount"])

    return df[EXPECTED_COLUMNS]

