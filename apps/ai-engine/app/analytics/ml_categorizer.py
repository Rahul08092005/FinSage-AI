"""ML-based expense categorizer (Step 6 + Step 10).

Uses a scikit-learn Pipeline (TfidfVectorizer + MultinomialNB) trained on
transaction descriptions.  The fitted pipeline is persisted as a pickle file
so it survives server restarts.

If scikit-learn is not installed, every function degrades gracefully (same
"mock fallback" pattern as OCRAdapter + pdf_parser).

Model file path: app/analytics/model.pkl
This is a build artifact -- it is excluded from version control via .gitignore.
"""
import os
import pickle
import warnings
from typing import Optional

# Path to the persisted model, relative to this file
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _sklearn_available() -> bool:
    try:
        import sklearn  # noqa: F401
        return True
    except ImportError:
        return False


def _build_pipeline():
    """Return a fresh, unfitted TfidfVectorizer + MultinomialNB pipeline."""
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB

    return Pipeline([
        ("tfidf", TfidfVectorizer(lowercase=True, ngram_range=(1, 2))),
        ("clf",   MultinomialNB()),
    ])


def _load_model():
    """Load the pickled pipeline from disk, or return None if not found."""
    if not os.path.exists(_MODEL_PATH):
        return None
    try:
        with open(_MODEL_PATH, "rb") as fh:
            return pickle.load(fh)
    except Exception:
        return None


def _save_model(pipeline) -> None:
    """Persist the fitted pipeline to disk."""
    with open(_MODEL_PATH, "wb") as fh:
        pickle.dump(pipeline, fh)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def train_categorizer(labeled_transactions: list[dict]) -> None:
    """Fit a TF-IDF + MultinomialNB pipeline on labeled transaction data.

    Args:
        labeled_transactions: List of dicts, each with at least:
            "description" (str) and "category" (str).

    Side-effect:
        Writes (or overwrites) the model pickle at app/analytics/model.pkl.
        Silently skips if scikit-learn is not installed or the training set
        is empty / has fewer than 2 distinct classes.
    """
    if not _sklearn_available():
        warnings.warn(
            "scikit-learn is not installed -- ML categorizer unavailable. "
            "Install with: pip install scikit-learn",
            ImportWarning,
            stacklevel=2,
        )
        return

    if not labeled_transactions:
        return

    descriptions = [str(t.get("description", "")) for t in labeled_transactions]
    categories   = [str(t.get("category",    "Other")) for t in labeled_transactions]

    if len(set(categories)) < 2:
        # MultinomialNB needs at least 2 classes to be meaningful
        return

    pipeline = _build_pipeline()
    pipeline.fit(descriptions, categories)
    _save_model(pipeline)


def predict_category(description: str) -> Optional[str]:
    """Predict the category for a transaction description using the trained model.

    Args:
        description: Raw transaction description string.

    Returns:
        The predicted category string, or None if no model has been trained yet
        or scikit-learn is not available.
    """
    if not _sklearn_available():
        return None

    model = _load_model()
    if model is None:
        return None

    try:
        result = model.predict([description])
        return str(result[0])
    except Exception:
        return None


def retrain_from_corrections(corrected_transactions: list[dict]) -> None:
    """Re-fit the pipeline, incorporating hand-corrected (description, category) pairs.

    Loads any existing model training data is not stored separately, so this
    re-trains from scratch on the corrected_transactions list alone.  For a
    production system you would union corrected data with the original labeled
    set; for Phase 3 demo purposes, correcting even a handful of entries and
    observing the change in predict_category() is sufficient.

    Args:
        corrected_transactions: List of dicts with "description" and "category".

    Side-effect:
        Re-pickles the fitted model to app/analytics/model.pkl.
    """
    train_categorizer(corrected_transactions)
