import shutil
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from search_kb_model import (
    answer_product_query,
    build_chunk_id,
    chunk_text,
    load_product_chunks,
    search_product_chunks,
)


class FakeCollection:
    def __init__(self, result):
        self.result = result
        self.query_calls = []

    def query(self, **kwargs):
        self.query_calls.append(kwargs)
        return self.result


class SearchKbModelTests(unittest.TestCase):
    def test_chunk_text_creates_overlapping_chunks(self):
        text = " ".join(f"word{i}" for i in range(10))

        chunks = chunk_text(text, size=4, overlap=1)

        self.assertEqual(
            chunks,
            [
                "word0 word1 word2 word3",
                "word3 word4 word5 word6",
                "word6 word7 word8 word9",
                "word9",
            ],
        )

    def test_load_product_chunks_reads_txt_files_and_builds_ids(self):
        directory = Path(__file__).resolve().parent / ".tmp_product_chunks"
        directory.mkdir(exist_ok=True)

        try:
            (directory / "camera.txt").write_text("alpha beta gamma", encoding="utf-8")
            chunks = load_product_chunks(directory)
        finally:
            shutil.rmtree(directory, ignore_errors=True)

        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0]["id"], build_chunk_id("camera.txt", 0))
        self.assertEqual(chunks[0]["source"], "camera.txt")
        self.assertEqual(chunks[0]["text"], "alpha beta gamma")

    def test_search_product_chunks_formats_chroma_results(self):
        collection = FakeCollection(
            {
                "documents": [["chunk one", "chunk two"]],
                "metadatas": [[{"source": "a.txt"}, {"source": "b.txt"}]],
                "distances": [[0.12, 0.34]],
            }
        )

        results = search_product_chunks("camera", collection, 2)

        self.assertEqual(
            results,
            [
                {"text": "chunk one", "source": "a.txt", "distance": 0.12},
                {"text": "chunk two", "source": "b.txt", "distance": 0.34},
            ],
        )
        self.assertEqual(collection.query_calls[0]["query_texts"], ["camera"])
        self.assertEqual(collection.query_calls[0]["n_results"], 2)

    @patch(
        "kb.chroma_kb.search_product_chunks",
        return_value=[
            {"text": "Ferrari Sports Car", "source": "ferrari_car.txt", "distance": 0.91}
        ],
    )
    def test_answer_product_query_returns_no_match_for_weak_result(self, _mock_search):
        result = answer_product_query("Tell me about boats", object(), 3)

        self.assertEqual(
            result["answer"],
            "We do not have a matching product for that request in the knowledge base.",
        )
        self.assertIsNone(result["source"])
        self.assertEqual(len(result["matches"]), 1)


if __name__ == "__main__":
    unittest.main()
