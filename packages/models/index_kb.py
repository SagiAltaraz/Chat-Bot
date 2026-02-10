from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer

# ---------------- CONFIG ---------------- #
DATA_DIR = "../../data/products"
CHROMA_DB_DIR = "./chroma_db"
COLLECTION_NAME = "products_kb"

CHUNK_SIZE = 300
CHUNK_OVERLAP = 50
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# ---------------------------------------- #


def load_text_files(directory):
    """Load all .txt files from a directory"""
    return [
        {"filename": f.name, "text": f.read_text(encoding="utf-8")}
        for f in Path(directory).glob("*.txt")
    ]


def chunk_text(text, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into overlapping chunks"""
    words = text.split()
    if len(words) <= size:
        return [text]
    return [" ".join(words[i:i+size]) for i in range(0, len(words), size - overlap)]


def main():
    print("Loading embedding model...")
    model = SentenceTransformer(EMBEDDING_MODEL)

    print("Loading documents...")
    documents = load_text_files(DATA_DIR)
    print(f"Found {len(documents)} documents")

    print("Initializing ChromaDB...")
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    client.delete_collection(name=COLLECTION_NAME) if COLLECTION_NAME in [c.name for c in client.list_collections()] else None
    collection = client.create_collection(name=COLLECTION_NAME)

    doc_id = 0
    for doc in documents:
        chunks = chunk_text(doc["text"])
        embeddings = model.encode(chunks, show_progress_bar=False).tolist()
        collection.add(
            ids=[f"doc_{doc_id + i}" for i in range(len(chunks))],
            documents=chunks,
            embeddings=embeddings,
            metadatas=[{"source": doc["filename"]} for _ in chunks]
        )
        doc_id += len(chunks)

    print(f"Indexed {len(documents)} documents into '{COLLECTION_NAME}' at {CHROMA_DB_DIR}")
    print("✅ Knowledge base ready!")


if __name__ == "__main__":
    main()