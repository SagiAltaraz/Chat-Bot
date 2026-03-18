from pathlib import Path
from typing import Any

from kb.embedding_kb import OllamaEmbeddingFunction
from kb.model_config import (
    CHROMA_COLLECTION,
    CHROMA_DIR,
    DATA_DIR,
    MAX_PRODUCT_MATCH_DISTANCE,
    QWEN_MODEL,
)
from kb.planner_kb import summarize_best_match
from kb.text_chunks_kb import load_product_chunks


def get_chroma_client(persist_directory: Path = CHROMA_DIR) -> Any:
    """Create or open the persistent Chroma client for the local KB store."""
    import chromadb

    # Open a persistent local Chroma database for the product knowledge base.
    persist_directory.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(persist_directory))


def get_product_collection(
    client: Any = None,
    collection_name: str = CHROMA_COLLECTION,
) -> Any:
    """Create or reopen the product collection with the Ollama embedding function."""
    # Create or reopen the product collection with the Ollama embedding adapter.
    chroma_client = client or get_chroma_client()
    return chroma_client.get_or_create_collection(
        name=collection_name,
        embedding_function=OllamaEmbeddingFunction(),
    )


def sync_product_collection(
    directory: Path = DATA_DIR,
    client: Any = None,
) -> tuple[Any, int]:
    """Sync product text chunks from disk into Chroma and return the collection plus count."""
    # Keep the vector store aligned with the current product text files.
    collection = get_product_collection(client)
    product_chunks = load_product_chunks(directory)

    existing_ids = set(collection.get(include=[])["ids"])
    current_ids = {chunk["id"] for chunk in product_chunks}
    stale_ids = list(existing_ids - current_ids)

    # Remove vectors that no longer have a matching chunk on disk.
    if stale_ids:
        collection.delete(ids=stale_ids)

    # Upsert the current chunks so new and changed documents are indexed.
    if product_chunks:
        collection.upsert(
            ids=[chunk["id"] for chunk in product_chunks],
            documents=[chunk["text"] for chunk in product_chunks],
            metadatas=[{"source": chunk["source"]} for chunk in product_chunks],
        )

    return collection, len(product_chunks)


def search_product_chunks(
    query: str, collection: Any, n_results: int = 3
) -> list[dict]:
    """Run semantic retrieval in Chroma and return normalized chunk matches."""
    # Run semantic similarity search in Chroma and normalize the response shape.
    result = collection.query(
        query_texts=[query],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]

    return [
        {
            "text": document,
            "source": metadata.get("source") if metadata else None,
            "distance": distance,
        }
        for document, metadata, distance in zip(documents, metadatas, distances)
    ]


def answer_product_query(
    query: str,
    collection: Any,
    n_results: int = 3,
    model_name: str = QWEN_MODEL,
) -> dict[str, Any]:
    """Retrieve the best-matching product context and summarize it into a final answer."""
    # Retrieve the closest chunks, choose the best source, and summarize it.
    results = search_product_chunks(query, collection, n_results)
    if not results:
        return {
            "answer": "I could not find a matching product in the knowledge base.",
            "source": None,
            "matches": [],
        }

    best_result = results[0]
    best_distance = best_result.get("distance")

    # Reject weak semantic matches so unrelated prompts do not get forced onto the nearest product.
    if best_distance is None or best_distance > MAX_PRODUCT_MATCH_DISTANCE:
        return {
            "answer": "We do not have a matching product for that request in the knowledge base.",
            "source": None,
            "matches": results,
        }

    best_source = best_result["source"]
    best_source_chunks = [
        result["text"] for result in results if result.get("source") == best_source
    ]
    # Merge chunks from the top source so the summarizer gets a fuller context window.
    context = "\n\n".join(best_source_chunks or [best_result["text"]])

    return {
        "answer": summarize_best_match(query, best_source, context, model_name),
        "source": best_source,
        "matches": results,
    }
