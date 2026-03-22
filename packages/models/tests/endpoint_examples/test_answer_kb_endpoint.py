import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import make_test_client, print_response


class AnswerKbEndpointExamplesTests(unittest.TestCase):
    def test_answer_kb_runs_real_retrieval_and_summary_model(self):
        with make_test_client() as client:
            response = client.post(
                "/answer_kb",
                json={
                    "query": "Which product is best for immersive video and action sports?",
                    "n_results": 3,
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        print_response("answer_kb", body)
        self.assertIn("answer", body)
        self.assertIn("source", body)
        self.assertIn("matches", body)
        self.assertIn("response_time_ms", body)
        self.assertTrue(body["answer"].strip())
        self.assertEqual(body["source"], "insta360_x5.txt")
        self.assertGreaterEqual(len(body["matches"]), 1)
        self.assertLessEqual(len(body["answer"].splitlines()), 2)
        self.assertIsInstance(body["response_time_ms"], (int, float))
        self.assertGreaterEqual(body["response_time_ms"], 0)


if __name__ == "__main__":
    unittest.main()
