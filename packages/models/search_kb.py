import chromadb
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHROMA_DB_DIR = "./chroma_db"
COLLECTION_NAME = "products_kb"

app = FastAPI()
model: SentenceTransformer = None
collection = None


class SearchRequest(BaseModel):
    query: str
    n_results: int = 3


@app.on_event("startup")
def startup():
    global model, collection
    model = SentenceTransformer(EMBEDDING_MODEL)
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    collection = client.get_collection(name=COLLECTION_NAME)
    print(f"Model loaded. Collection '{COLLECTION_NAME}' has {collection.count()} chunks.")


@app.post("/search_kb")
def search_kb(req: SearchRequest):
    query_embedding = model.encode([req.query]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=req.n_results)

    return {
        "results": [
            {"text": doc, "source": meta["source"], "distance": dist}
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            )
        ]
    }
