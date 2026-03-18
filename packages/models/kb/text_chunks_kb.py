from pathlib import Path

from kb.model_config import CHUNK_OVERLAP, CHUNK_SIZE, DATA_DIR


def load_product_chunks(directory: Path = DATA_DIR) -> list[dict]:
    """Load product text files from disk and convert them into chunk records."""
    chunks: list[dict[str, str]] = []

    # Read each product document and split it into retrievable chunk records.
    for file_path in directory.glob("*.txt"):
        text = file_path.read_text(encoding="utf-8").strip()
        for index, chunk in enumerate(chunk_text(text)):
            chunks.append(
                {
                    "id": build_chunk_id(file_path.name, index),
                    "source": file_path.name,
                    "text": chunk,
                }
            )

    return chunks


def chunk_text(
    text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP
) -> list[str]:
    """Split text into overlapping word chunks for retrieval."""
    # Split long documents into overlapping word windows to improve recall.
    words = text.split()
    if len(words) <= size:
        return [text]

    step = max(1, size - overlap)
    return [" ".join(words[index : index + size]) for index in range(0, len(words), step)]


def build_chunk_id(source: str, index: int) -> str:
    """Build a stable chunk identifier from the source filename and chunk index."""
    # Stable IDs let Chroma update existing chunks instead of duplicating them.
    source_stem = Path(source).stem
    return f"{source_stem}:{index}"
