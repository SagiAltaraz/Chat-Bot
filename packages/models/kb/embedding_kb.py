from typing import Any

from ollama import embed

from kb.model_config import EMBEDDING_MODEL


class OllamaEmbeddingFunction:
    # Adapter that lets Chroma request embeddings through Ollama.
    def __init__(self, model_name: str = EMBEDDING_MODEL):
        """Store the Ollama embedding model name used for vector generation."""
        self.model_name = model_name

    @staticmethod
    def name() -> str:
        """Return the embedding function identifier expected by Chroma."""
        return "ollama"

    @staticmethod
    def build_from_config(config: dict[str, Any]) -> "OllamaEmbeddingFunction":
        """Recreate the embedding function from serialized Chroma config."""
        return OllamaEmbeddingFunction(
            model_name=config.get("model_name", EMBEDDING_MODEL)
        )

    def get_config(self) -> dict[str, Any]:
        """Return the serializable configuration for this embedding function."""
        return {"model_name": self.model_name}

    def is_legacy(self) -> bool:
        """Tell Chroma this adapter implements the current embedding interface."""
        return False

    def default_space(self) -> str:
        """Return the default vector distance space for this embedding function."""
        return "cosine"

    def supported_spaces(self) -> list[str]:
        """Return the vector distance spaces supported by this embedding function."""
        return ["cosine", "l2", "ip"]

    def embed_documents(self, input: list[str]) -> list[list[float]]:
        """Embed document texts for indexing."""
        return self.__call__(input)

    def embed_query(self, input: list[str]) -> list[list[float]]:
        """Embed query texts for retrieval."""
        return self.__call__(input)

    def __call__(self, input: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts using Ollama."""
        # Generate embeddings for documents or queries using the configured model.
        response = embed(model=self.model_name, input=input)
        return response["embeddings"]
