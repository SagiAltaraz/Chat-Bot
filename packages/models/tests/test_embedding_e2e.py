import shutil
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from search_kb_model import get_chroma_client, search_product_chunks, sync_product_collection


class EmbeddingEndToEndTests(unittest.TestCase):
    def test_real_chroma_and_ollama_embedding_pipeline(self):
        try:
            client = get_chroma_client(
                Path(__file__).resolve().parent / ".tmp_chroma_e2e"
            )
        except Exception as error:
            self.skipTest(f"Chroma is unavailable in this environment: {error}")

        data_dir = Path(__file__).resolve().parent / ".tmp_e2e_products"
        chroma_dir = Path(__file__).resolve().parent / ".tmp_chroma_e2e"
        data_dir.mkdir(exist_ok=True)

        try:
            (data_dir / "camera.txt").write_text(
                "Insta360 X5 is a 360 action camera for immersive video capture.",
                encoding="utf-8",
            )
            (data_dir / "laptop.txt").write_text(
                "MacBook Pro is a professional laptop for development and video editing.",
                encoding="utf-8",
            )

            try:
                collection, chunk_count = sync_product_collection(
                    directory=data_dir,
                    client=client,
                )
                results = search_product_chunks("Which camera is good for immersive video?", collection, 1)
            except Exception as error:
                self.skipTest(
                    "Real embedding test requires a working Ollama server and the "
                    f"'nomic-embed-text' model: {error}"
                )
        finally:
            shutil.rmtree(data_dir, ignore_errors=True)
            shutil.rmtree(chroma_dir, ignore_errors=True)

        self.assertEqual(chunk_count, 2)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["source"], "camera.txt")
        self.assertIn("camera", results[0]["text"].lower())


if __name__ == "__main__":
    unittest.main()
