import json
import logging
from contextlib import asynccontextmanager
from time import perf_counter

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from search_kb_model import (
    answer_product_query,
    load_router_system_prompt,
    route_with_qwen,
    search_product_chunks,
    sync_product_collection,
)

PORT = 5001
ROUTER_SYSTEM_PROMPT = load_router_system_prompt()

product_collection = None

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
logger = logging.getLogger("search_kb")


def with_response_time(payload: dict, started_at: float) -> dict:
    """Attach the endpoint response time in milliseconds to the JSON payload."""
    response_time_ms = round((perf_counter() - started_at) * 1000, 2)
    return {
        **payload,
        "response_time_ms": response_time_ms,
    }


# Request body for semantic KB search.
class SearchRequest(BaseModel):
    query: str
    n_results: int = 3


# Request body for concise KB answering based on the best semantic match.
class AnswerRequest(BaseModel):
    query: str
    n_results: int = 3


# Request body for the routing/classification endpoint.
class ClassifyRequest(BaseModel):
    prompt: str


# One routed tool step returned by the planner model.
class PlanStep(BaseModel):
    intent: str
    parameters: dict


# Full structured planner response expected from Qwen.
class PlanResponse(BaseModel):
    plan: list[PlanStep]
    final_answer_synthesis: str


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global product_collection
    # Build or refresh the persisted vector collection before serving requests.
    product_collection, chunk_count = sync_product_collection()
    logger.info("Products KB indexed %s text chunks into Chroma", chunk_count)
    yield


# FastAPI app state lives here so startup can prepare the Chroma-backed KB once.
app = FastAPI(lifespan=lifespan)


@app.post("/classify")
def classify(req: ClassifyRequest):
    started_at = perf_counter()
    try:
        logger.info("POST /classify prompt_length=%s", len(req.prompt))
        # Ask Qwen to convert the user message into the expected JSON plan.
        payload = route_with_qwen(req.prompt, ROUTER_SYSTEM_PROMPT)
        return with_response_time(
            PlanResponse.model_validate(payload).model_dump(),
            started_at,
        )
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=500,
            detail=f"Qwen returned invalid plan JSON: {error}",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Qwen router model is unavailable: {error}",
        ) from error


@app.post("/search_kb")
def search_kb(req: SearchRequest):
    started_at = perf_counter()
    logger.info("POST /search_kb n_results=%s query=%r", req.n_results, req.query)
    # If startup indexing failed or has not run, return an empty search result.
    if product_collection is None:
        logger.warning("search_kb requested before product collection was initialized")
        return with_response_time({"results": []}, started_at)

    # Query the vector store and return the nearest matching chunks.
    results = search_product_chunks(req.query, product_collection, req.n_results)
    logger.info("search_kb returned %s matches", len(results))
    return with_response_time({"results": results}, started_at)


@app.post("/answer_kb")
def answer_kb(req: AnswerRequest):
    started_at = perf_counter()
    logger.info("POST /answer_kb n_results=%s query=%r", req.n_results, req.query)
    # If startup indexing failed or has not run, return an empty answer payload.
    if product_collection is None:
        logger.warning("answer_kb requested before product collection was initialized")
        return with_response_time(
            {"answer": "", "source": None, "matches": []},
            started_at,
        )

    # Retrieve the best semantic match and summarize it into a short final answer.
    payload = answer_product_query(req.query, product_collection, req.n_results)
    logger.info(
        "answer_kb source=%r matches=%s",
        payload.get("source"),
        len(payload.get("matches", [])),
    )
    return with_response_time(payload, started_at)


if __name__ == "__main__":
    # Local development entrypoint for the FastAPI server.
    logger.info("Starting model server on http://127.0.0.1:%s", PORT)
    uvicorn.run(app, host="127.0.0.1", port=PORT)
