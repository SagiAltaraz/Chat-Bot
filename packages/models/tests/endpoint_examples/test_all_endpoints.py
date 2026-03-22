import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from test_answer_kb_endpoint import AnswerKbEndpointExamplesTests
from test_classify_endpoint import ClassifyEndpointExamplesTests
from test_search_kb_endpoint import SearchKbEndpointExamplesTests


def load_tests(loader, tests, pattern):
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(ClassifyEndpointExamplesTests))
    suite.addTests(loader.loadTestsFromTestCase(SearchKbEndpointExamplesTests))
    suite.addTests(loader.loadTestsFromTestCase(AnswerKbEndpointExamplesTests))
    return suite


if __name__ == "__main__":
    unittest.main()
