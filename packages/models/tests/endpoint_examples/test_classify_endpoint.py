import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import make_test_client, print_response


class ClassifyEndpointExamplesTests(unittest.TestCase):
    def test_classify_runs_real_planner_model(self):
        with make_test_client() as client:
            response = client.post(
                "/classify",
                json={
                    "prompt": "What is the weather in Paris and convert 100 USD to ILS"
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        print_response("classify", body)
        self.assertIn("plan", body)
        self.assertIn("final_answer_synthesis", body)
        self.assertIn("response_time_ms", body)
        self.assertGreaterEqual(len(body["plan"]), 2)
        self.assertIsInstance(body["response_time_ms"], (int, float))
        self.assertGreaterEqual(body["response_time_ms"], 0)

        intents = [step["intent"] for step in body["plan"]]
        self.assertIn("weather", intents)
        self.assertIn("exchange", intents)

        weather_step = next(
            step for step in body["plan"] if step["intent"] == "weather"
        )
        exchange_step = next(
            step for step in body["plan"] if step["intent"] == "exchange"
        )

        self.assertEqual(weather_step["parameters"].get("city"), "Paris")
        self.assertEqual(exchange_step["parameters"].get("from"), "USD")
        self.assertEqual(exchange_step["parameters"].get("to"), "ILS")
        self.assertEqual(exchange_step["parameters"].get("amount"), 100)
        self.assertIn("<result_from_tool_1>", body["final_answer_synthesis"])


if __name__ == "__main__":
    unittest.main()
