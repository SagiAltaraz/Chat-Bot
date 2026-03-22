import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import make_test_client, print_response


class SearchKbEndpointExamplesTests(unittest.TestCase):
    def test_search_kb_runs_real_embedding_and_retrieval(self):
        with make_test_client() as client:
            response = client.post(
                "/search_kb",
                json={
                    "query": "Which camera is good for immersive video?",
                    "n_results": 2,
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        print_response("search_kb", body)
        self.assertIn("results", body)
        self.assertIn("response_time_ms", body)
        self.assertGreaterEqual(len(body["results"]), 1)
        self.assertIsInstance(body["response_time_ms"], (int, float))
        self.assertGreaterEqual(body["response_time_ms"], 0)

        top_result = body["results"][0]
        self.assertIn("text", top_result)
        self.assertIn("source", top_result)
        self.assertIn("distance", top_result)
        self.assertTrue(top_result["text"])
        self.assertIsInstance(top_result["distance"], (int, float))
        self.assertEqual(top_result["source"], "insta360_x5.txt")


if __name__ == "__main__":
    unittest.main()
