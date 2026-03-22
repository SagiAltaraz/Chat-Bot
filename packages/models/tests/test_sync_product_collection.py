import shutil
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from search_kb_model import build_chunk_id, sync_product_collection


class FakeCollection:
    def __init__(self, existing_ids=None):
        self.ids = list(existing_ids or [])
        self.deleted_ids = []
        self.upsert_payload = None

    def get(self, include=None):
        return {"ids": list(self.ids)}

    def delete(self, ids):
        self.deleted_ids.extend(ids)
        self.ids = [item for item in self.ids if item not in ids]

    def upsert(self, ids, documents, metadatas):
        self.upsert_payload = {
            "ids": ids,
            "documents": documents,
            "metadatas": metadatas,
        }
        current = set(self.ids)
        for item in ids:
            if item not in current:
                self.ids.append(item)


class SyncProductCollectionTests(unittest.TestCase):
    def test_sync_uses_current_files_as_source_of_truth(self):
        fake_collection = FakeCollection(existing_ids=["obsolete:0"])
        data_dir = Path(__file__).resolve().parent / ".tmp_sync_products_patched"
        data_dir.mkdir(exist_ok=True)

        try:
            (data_dir / "camera.txt").write_text(
                "alpha beta gamma delta",
                encoding="utf-8",
            )

            from unittest.mock import patch

            with patch("kb.chroma_kb.get_product_collection", return_value=fake_collection):
                synced_collection, chunk_count = sync_product_collection(
                    directory=data_dir,
                    client=object(),
                )
        finally:
            shutil.rmtree(data_dir, ignore_errors=True)

        self.assertIs(synced_collection, fake_collection)
        self.assertEqual(chunk_count, 1)
        self.assertEqual(fake_collection.deleted_ids, ["obsolete:0"])
        self.assertEqual(
            fake_collection.upsert_payload,
            {
                "ids": [build_chunk_id("camera.txt", 0)],
                "documents": ["alpha beta gamma delta"],
                "metadatas": [{"source": "camera.txt"}],
            },
        )


if __name__ == "__main__":
    unittest.main()
