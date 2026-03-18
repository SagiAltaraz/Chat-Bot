import json
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

    return json.loads(response.message.content)


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
