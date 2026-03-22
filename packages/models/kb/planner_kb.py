import json
import re
from pathlib import Path

from ollama import chat

from kb.model_config import (
    PRODUCT_ANSWER_INSTRUCTIONS_PATH,
    QWEN_MODEL,
    SYSTEM_INSTRUCTIONS_PATH,
)


def load_router_system_prompt(
    instructions_path: Path = SYSTEM_INSTRUCTIONS_PATH,
) -> str:
    """Load and flatten the router system prompt from the JSON instructions file."""
    # Load the planner system prompt from disk and flatten it into one string.
    with instructions_path.open("r", encoding="utf-8") as file:
        system_instructions = json.load(file)

    return "\n".join(system_instructions["router"])


def route_with_qwen(
    prompt: str,
    router_system_prompt: str,
    model_name: str = QWEN_MODEL,
) -> dict:
    """Route a user prompt through Qwen and parse the returned JSON plan."""
    # Ask Qwen to convert a user message into the structured plan JSON.
    response = chat(
        model=model_name,
        messages=[
            {"role": "system", "content": router_system_prompt},
            {"role": "user", "content": prompt},
        ],
        format="json",
        options={"temperature": 0},
    )

    return normalize_plan(prompt, json.loads(response.message.content))


NON_PRODUCT_BOUNDARY_PATTERNS = (
    r"\bwhat(?:'s| is) the weather\b",
    r"\bweather in\b",
    r"\bforecast\b",
    r"\bconvert\b",
    r"\bexchange\b",
    r"\bhow much is\b",
    r"\bcalculate\b",
    r"\bsolve\b",
)

PRODUCT_INTRO_PATTERNS = (
    r"\btell me about\b",
    r"\bwhat do you know about\b",
    r"\binfo(?:rmation)? about\b",
    r"\bdetails about\b",
    r"\bdescribe\b",
)


def normalize_plan(prompt: str, payload: dict) -> dict:
    """Clean up planner output so mixed-intent product queries stay product-only."""
    plan = payload.get("plan")
    if not isinstance(plan, list):
        return payload

    has_non_product_intent = any(
        step.get("intent") not in {"products", "general"} for step in plan
        if isinstance(step, dict)
    )

    for step in plan:
        if not isinstance(step, dict) or step.get("intent") != "products":
            continue

        parameters = step.setdefault("parameters", {})
        if not isinstance(parameters, dict):
            step["parameters"] = {}
            parameters = step["parameters"]

        product_name = _clean_whitespace(str(parameters.get("product_name", "")))
        query = _clean_whitespace(str(parameters.get("query", "")))

        parameters["product_name"] = product_name
        parameters["query"] = _normalize_product_query(
            prompt,
            product_name,
            query,
            has_non_product_intent,
        )

    return payload


def _normalize_product_query(
    prompt: str,
    product_name: str,
    query: str,
    has_non_product_intent: bool,
) -> str:
    """Trim unrelated intent text from a product query when the planner over-groups."""
    if not query:
        return product_name

    if not has_non_product_intent or not _contains_non_product_signal(query):
        return query

    extracted_clause = _extract_product_clause(prompt, product_name)
    if extracted_clause:
        return extracted_clause

    if product_name:
        return f"Tell me about {product_name}"

    return query


def _contains_non_product_signal(text: str) -> bool:
    text = text.lower()
    return any(re.search(pattern, text) for pattern in NON_PRODUCT_BOUNDARY_PATTERNS)


def _extract_product_clause(prompt: str, product_name: str) -> str | None:
    prompt_text = _clean_whitespace(prompt)
    prompt_lower = prompt_text.lower()
    product_lower = product_name.lower().strip()

    if not product_lower:
        return None

    product_index = prompt_lower.find(product_lower)
    if product_index == -1:
        return None

    start_index = product_index
    for pattern in PRODUCT_INTRO_PATTERNS:
        matches = list(re.finditer(pattern, prompt_lower))
        for match in matches:
            if match.start() <= product_index:
                start_index = min(start_index, match.start())

    end_index = len(prompt_text)
    for pattern in NON_PRODUCT_BOUNDARY_PATTERNS:
        match = re.search(pattern, prompt_lower[product_index:])
        if match:
            end_index = min(end_index, product_index + match.start())

    clause = prompt_text[start_index:end_index].strip(" ,.?")
    return _clean_whitespace(clause) or None


def _clean_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def load_product_answer_instructions(
    instructions_path: Path = PRODUCT_ANSWER_INSTRUCTIONS_PATH,
) -> str:
    """Load the product-answer system instructions from the text file."""
    return instructions_path.read_text(encoding="utf-8").strip()


def summarize_best_match(
    query: str,
    source: str | None,
    context: str,
    model_name: str = QWEN_MODEL,
) -> str:
    """Summarize the best retrieved product context into a short final answer."""
    # Turn the best retrieved product context into a short final answer.
    response = chat(
        model=model_name,
        messages=[
            {
                "role": "system",
                "content": load_product_answer_instructions(),
            },
            {
                "role": "user",
                "content": (
                    f"Question: {query}\n\n"
                    f"Source: {source}\n\n"
                    f"Context:\n{context}"
                ),
            },
        ],
        options={"temperature": 0.2},
    )

    return response.message.content.strip()
