import uvicorn
import chromadb
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHROMA_DB_DIR = "./chroma_db"
PRODUCTS_COLLECTION = "products_kb"
INTENTS_COLLECTION = "intents_kb"
PORT = 5001

app = FastAPI()
model: SentenceTransformer = None
products_collection = None
intents_collection = None


class SearchRequest(BaseModel):
    query: str
    n_results: int = 3


class ClassifyRequest(BaseModel):
    prompt: str


@app.on_event("startup")
def startup():
    global model, products_collection, intents_collection
    model = SentenceTransformer(EMBEDDING_MODEL)
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    products_collection = client.get_collection(name=PRODUCTS_COLLECTION)
    intents_collection = client.get_collection(name=INTENTS_COLLECTION)
    print(f"Products: {products_collection.count()} chunks, Intents: {intents_collection.count()} examples")


@app.post("/classify")
def classify(req: ClassifyRequest):
    query_embedding = model.encode([req.prompt]).tolist()
    results = intents_collection.query(query_embeddings=query_embedding, n_results=1)

    intent = results["metadatas"][0][0]["intent"]
    distance = results["distances"][0][0]

    return {
        "intent": intent,
        "parameters": None,
        "confidence": round(1 - distance, 4),
    }


@app.post("/search_kb")
def search_kb(req: SearchRequest):
    query_embedding = model.encode([req.query]).tolist()
    results = products_collection.query(query_embeddings=query_embedding, n_results=req.n_results)

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


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT)
