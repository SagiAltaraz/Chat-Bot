import json
import uvicorn
import chromadb
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from ollama import chat

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHROMA_DB_DIR = "./chroma_db"
PRODUCTS_COLLECTION = "products_kb"
PORT = 5001

with open("system_instructions.json", "r", encoding="utf-8") as f:
    SYSTEM_INSTRUCTIONS = json.load(f)

ROUTER_SYSTEM_PROMPT = "\n".join(SYSTEM_INSTRUCTIONS["router"])

app = FastAPI()
model: SentenceTransformer = None
products_collection = None


class SearchRequest(BaseModel):
    query: str
    n_results: int = 3


class ClassifyRequest(BaseModel):
    prompt: str


@app.on_event("startup")
def startup():
    global model, products_collection
    model = SentenceTransformer(EMBEDDING_MODEL)
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    products_collection = client.get_collection(name=PRODUCTS_COLLECTION)
    print(f"Products KB: {products_collection.count()} chunks loaded")


@app.post("/classify")
def classify(req: ClassifyRequest):
    response = chat(
        model="qwen2.5:7b",
        messages=[
            {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
            {"role": "user", "content": req.prompt},
        ],
        format="json",
        options={"temperature": 0},
    )
    return json.loads(response.message.content)


@app.post("/search_kb")
def search_kb(req: SearchRequest):
    query_embedding = model.encode([req.query]).tolist()
    results = products_collection.query(
        query_embeddings=query_embedding, n_results=req.n_results
    )

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
