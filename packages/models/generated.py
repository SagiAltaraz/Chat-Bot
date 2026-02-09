from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple, Dict

import numpy as np
from sentence_transformers import SentenceTransformer


@dataclass
class ClassificationResult:
    category: str
    confidence_best: float  # similarity(top1)
    confidence_margin: float  # similarity(top1) - similarity(top2)
    scores: Dict[str, float]  # label -> similarity


class PromptClassifier:
    def __init__(
        self, labels: List[str], model_name: str = "google/embeddinggemma-300m"
    ):
        self.labels = labels
        self.model = SentenceTransformer(model_name)

        # Pre-embed labels once (fast for repeated classification)
        self._label_emb = self.model.encode(
            labels,
            prompt_name="Classification",
            normalize_embeddings=True,
        )

    def classify(self, prompt: str) -> ClassificationResult:
        prompt_emb = self.model.encode(
            [prompt],
            prompt_name="Classification",
            normalize_embeddings=True,
        )

        # Cosine similarity for normalized vectors = dot product
        sims = (prompt_emb @ self._label_emb.T).ravel()  # shape: (num_labels,)

        top1 = int(np.argmax(sims))
        best_label = self.labels[top1]
        best_score = float(sims[top1])

        # Margin vs 2nd best (helps detect uncertainty)
        if len(sims) > 1:
            top2 = float(np.partition(sims, -2)[-2])
            margin = float(best_score - top2)
        else:
            margin = 0.0

        scores = {label: float(score) for label, score in zip(self.labels, sims)}
        return ClassificationResult(
            category=best_label,
            confidence_best=best_score,
            confidence_margin=margin,
            scores=scores,
        )


if __name__ == "__main__":
    labels = ["weather", "exchange", "calculate"]

    clf = PromptClassifier(labels)

    prompts = [
        "How much is 6 plus 2?",
        "What is the current temperature in London?",
        "How much is 50 Dollars in Sheqels?",
    ]

    for p in prompts:
        r = clf.classify(p)
        print(f"prompt: {p}")
        print(f"  category: {r.category}")
        print(f"  confidence_best:   {r.confidence_best:.4f}")
        print(f"  confidence_margin: {r.confidence_margin:.4f}")
        print(f"  scores: { {k: round(v, 4) for k, v in r.scores.items()} }")
