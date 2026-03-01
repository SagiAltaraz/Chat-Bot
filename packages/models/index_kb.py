import json
from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer

# ---------------- CONFIG ---------------- #
DATA_DIR = "../../data/products"
INTENTS_FILE = "./intents.json"
CHROMA_DB_DIR = "./chroma_db"
PRODUCTS_COLLECTION = "products_kb"
INTENTS_COLLECTION = "intents_kb"

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
    return [" ".join(words[i : i + size]) for i in range(0, len(words), size - overlap)]


def reset_collection(client, name):
    if name in [c.name for c in client.list_collections()]:
        client.delete_collection(name=name)
    return client.create_collection(name=name)


def index_products(client, model):
    documents = load_text_files(DATA_DIR)
    print(f"Found {len(documents)} product documents")

    collection = reset_collection(client, PRODUCTS_COLLECTION)

    doc_id = 0
    for doc in documents:
        chunks = chunk_text(doc["text"])
        embeddings = model.encode(chunks, show_progress_bar=False).tolist()
        collection.add(
            ids=[f"product_{doc_id + i}" for i in range(len(chunks))],
            documents=chunks,
            embeddings=embeddings,
            metadatas=[{"source": doc["filename"]} for _ in chunks],
        )
        doc_id += len(chunks)

    print(f"Indexed {doc_id} product chunks into '{PRODUCTS_COLLECTION}'")


def index_intents(client, model):
    with open(INTENTS_FILE, "r", encoding="utf-8-sig") as f:
        intents = json.load(f)

    collection = reset_collection(client, INTENTS_COLLECTION)

    idx = 0
    for intent, examples in intents.items():
        embeddings = model.encode(examples, show_progress_bar=False).tolist()
        collection.add(
            ids=[f"intent_{idx + i}" for i in range(len(examples))],
            documents=examples,
            embeddings=embeddings,
            metadatas=[{"intent": intent} for _ in examples],
        )
        idx += len(examples)

    print(f"Indexed {idx} intent examples into '{INTENTS_COLLECTION}'")


def main():
    print("Loading embedding model...")
    model = SentenceTransformer(EMBEDDING_MODEL)

    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

    index_products(client, model)
    index_intents(client, model)

    print("Done!")


if __name__ == "__main__":
    main()
