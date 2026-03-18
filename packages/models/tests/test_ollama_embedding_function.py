import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from search_kb_model import EMBEDDING_MODEL, OllamaEmbeddingFunction


class OllamaEmbeddingFunctionTests(unittest.TestCase):
    @patch("kb.embedding_kb.embed")
    def test_embedding_function_calls_ollama_and_returns_embeddings(self, mock_embed):
        mock_embed.return_value = {
            "embeddings": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
        }

        embedding_function = OllamaEmbeddingFunction()
        result = embedding_function(["first chunk", "second chunk"])

        self.assertEqual(result, [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]])
        mock_embed.assert_called_once_with(
            model=EMBEDDING_MODEL,
            input=["first chunk", "second chunk"],
        )


if __name__ == "__main__":
    unittest.main()
