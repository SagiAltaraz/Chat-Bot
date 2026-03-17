import json
import re
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ollama import chat

QWEN_MODEL = "qwen2.5:7b"
DATA_DIR = Path("../../data/products")
CHUNK_SIZE = 180
CHUNK_OVERLAP = 30
PORT = 5001

with open("system_instructions.json", "r", encoding="utf-8") as f:
    SYSTEM_INSTRUCTIONS = json.load(f)

ROUTER_SYSTEM_PROMPT = "\n".join(SYSTEM_INSTRUCTIONS["router"])

app = FastAPI()
product_chunks: list[dict] = []


class SearchRequest(BaseModel):
    query: str
    n_results: int = 3


class ClassifyRequest(BaseModel):
    prompt: str


class PlanStep(BaseModel):
    intent: str
    parameters: dict


class PlanResponse(BaseModel):
    plan: list[PlanStep]
    final_answer_synthesis: str


@app.on_event("startup")
def startup():
    global product_chunks
    product_chunks = load_product_chunks(DATA_DIR)
    print(f"Products KB: {len(product_chunks)} text chunks loaded")


def route_with_qwen(prompt: str) -> PlanResponse:
    try:
        response = chat(
            model=QWEN_MODEL,
            messages=[
                {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            format="json",
            options={"temperature": 0},
        )
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Qwen router model '{QWEN_MODEL}' is unavailable: {error}",
        ) from error

    try:
        payload = json.loads(response.message.content)
        return PlanResponse.model_validate(payload)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Qwen returned invalid plan JSON: {error}",
        ) from error


@app.post("/classify")
def classify(req: ClassifyRequest):
    return route_with_qwen(req.prompt).model_dump()


@app.post("/search_kb")
def search_kb(req: SearchRequest):
    if not product_chunks:
        return {"results": []}

    ranked_results = sorted(
        (
            {
                "text": chunk["text"],
                "source": chunk["source"],
                "distance": score_chunk(req.query, chunk["text"]),
            }
            for chunk in product_chunks
        ),
        key=lambda result: result["distance"],
    )

    return {"results": ranked_results[: req.n_results]}


def load_product_chunks(directory: Path) -> list[dict]:
    chunks: list[dict] = []

    for file_path in directory.glob("*.txt"):
        text = file_path.read_text(encoding="utf-8").strip()
        for chunk in chunk_text(text):
            chunks.append({"source": file_path.name, "text": chunk})

    return chunks


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = text.split()
    if len(words) <= size:
        return [text]

    step = max(1, size - overlap)
    return [" ".join(words[index : index + size]) for index in range(0, len(words), step)]


def score_chunk(query: str, chunk: str) -> float:
    query_terms = tokenize(query)
    chunk_terms = tokenize(chunk)

    if not query_terms or not chunk_terms:
        return 1.0

    overlap = len(query_terms & chunk_terms)
    coverage = overlap / len(query_terms)

    if query.lower() in chunk.lower():
        coverage += 0.5

    return max(0.0, 1.0 - min(1.0, coverage))


def tokenize(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-zA-Z0-9]{2,}", text.lower())
        if not token.isdigit()
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT)
