import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kb.planner_kb import normalize_plan


class PlannerKbTests(unittest.TestCase):
    def test_normalize_plan_trims_non_product_text_from_product_query(self):
        prompt = (
            "tell me about ferrari what is the weather in tel aviv "
            "and convert 10 sheqels to dollar"
        )
        payload = {
            "plan": [
                {
                    "intent": "products",
                    "parameters": {
                        "product_name": "Ferrari",
                        "query": prompt,
                    },
                },
                {"intent": "weather", "parameters": {"city": "Tel Aviv"}},
                {
                    "intent": "exchange",
                    "parameters": {"from": "ILS", "to": "USD", "amount": 10},
                },
            ],
            "final_answer_synthesis": (
                "About Ferrari: <result_from_tool_1>. "
                "The weather in Tel Aviv is <result_from_tool_2>. "
                "10 ILS equals <result_from_tool_3> USD."
            ),
        }

        result = normalize_plan(prompt, payload)

        self.assertEqual(
            result["plan"][0]["parameters"]["query"],
            "tell me about ferrari",
        )
        self.assertEqual(result["plan"][0]["parameters"]["product_name"], "Ferrari")

    def test_normalize_plan_keeps_clean_product_query_unchanged(self):
        prompt = "tell me about ferrari"
        payload = {
            "plan": [
                {
                    "intent": "products",
                    "parameters": {
                        "product_name": "Ferrari",
                        "query": "tell me about ferrari",
                    },
                }
            ],
            "final_answer_synthesis": "About Ferrari: <result_from_tool_1>.",
        }

        result = normalize_plan(prompt, payload)

        self.assertEqual(
            result["plan"][0]["parameters"]["query"],
            "tell me about ferrari",
        )


if __name__ == "__main__":
    unittest.main()
