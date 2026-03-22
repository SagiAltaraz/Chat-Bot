# Model Timing Guide

This file gives a visual overview of which models or model-backed services can run during a chat request, what each one does, and where its timing comes from.

## At A Glance

```text
┌───────────────────┬──────────────────────┬─────────────────────────────────────┬────────────────────────┬──────────────────────────────────┐
│ UI Label          │ Model / Service      │ Responsibility                      │ Runs In                │ Timing Source                    │
├───────────────────┼──────────────────────┼─────────────────────────────────────┼────────────────────────┼──────────────────────────────────┤
│ Planner Model     │ Ollama `/classify`   │ Builds the structured execution plan│ Python FastAPI service │ Python `response_time_ms`        │
│ Product Search KB │ KB `/search_kb`      │ Retrieves matching product chunks   │ Python FastAPI service │ Python `response_time_ms`        │
│ gpt-4.1           │ OpenAI `gpt-4.1`     │ Generates grounded product answers  │ Server OpenAI client   │ Measured around `responses.create`│
│ gpt-4o-mini       │ OpenAI `gpt-4o-mini` │ Generates general chat replies      │ Server OpenAI client   │ Measured around `responses.create`│
└───────────────────┴──────────────────────┴─────────────────────────────────────┴────────────────────────┴──────────────────────────────────┘
```

## Execution Flow

```text
User Prompt
   │
   ▼
Planner Model
(`/classify`)
   │
   ▼
Structured Plan
   │
   ├── General chat branch ───────────────► OpenAI `gpt-4o-mini`
   │
   └── Product branch
       │
       ▼
   Product Search KB
   (`/search_kb`)
       │
       ▼
   OpenAI `gpt-4.1`
   grounded product answer
```

## What Shows In The UI

- The chat UI shows only the timing badges for models that actually ran for that specific message.
- A simple message might show only `gpt-4o-mini`.
- A mixed product message might show `Planner Model`, `Product Search KB`, and `gpt-4.1`.

## Important Notes

- Weather, exchange, and math steps do not currently add model timing rows unless a model is involved in that path.
- Product answering is split into retrieval first, then OpenAI generation.
- OpenAI timings are measured in the server client wrapper; planner and KB timings come from the Python model service response.
