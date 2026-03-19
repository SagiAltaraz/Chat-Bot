# Chat Bot

Multi-intent AI chat assistant built as a Bun monorepo with:

- `packages/client`: React + Vite chat UI
- `packages/server`: Express API and orchestration layer
- `packages/models`: FastAPI model service for planning and product search

The app can handle mixed prompts like weather, currency conversion, product questions, math, and general chat in a single message.

## Current Flow

1. The client sends a prompt to `POST /api/chat`.
2. The server asks the Python model service to classify the prompt into a structured plan.
3. The orchestrator runs each plan step.
4. Product requests use the Python KB search endpoint to retrieve matching chunks.
5. Retrieved product context is sent to OpenAI to generate the final product answer.
6. The final combined answer is returned to the UI.
7. The UI shows per-model timing badges for the models that already report timing.

## Architecture

```text
Client (React)
  -> Server (Express / Bun)
     -> Planner Model Service (FastAPI)
        -> /classify
     -> Tool Execution
        -> Weather API
        -> Exchange API
        -> Math service
        -> Product KB search (/search_kb)
     -> OpenAI generation
  -> Chat UI response + model timing badges
```

## Tech Stack

| Layer | Tech |
| --- | --- |
| Runtime | Bun |
| Frontend | React 19, Vite, TypeScript, Tailwind |
| Backend | Express 5, TypeScript |
| Model service | FastAPI, Python |
| Product retrieval | ChromaDB |
| General LLM generation | OpenAI |
| Planner / routing | Ollama Qwen |
| Database | Prisma + MySQL/MariaDB |

## Repository Layout

```text
chat-bot/
├── packages/
│   ├── client/
│   │   └── src/components/chat/
│   ├── server/
│   │   ├── controllers/
│   │   ├── llm/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── services/
│   └── models/
│       ├── kb/
│       ├── tests/
│       ├── search_kb.py
│       └── system_instructions.json
├── history/
├── index.ts
└── README.md
```

## Prerequisites

- Bun
- Node-compatible local environment for the client build tooling
- Python 3.10+
- MySQL or MariaDB
- Ollama with the planner model installed
- OpenAI API key
- OpenWeather API key

## Environment

Create a root `.env` file:

```env
OPENAI_API_KEY=sk-...
OPENWEATHER_API_KEY=...

DATABASE_URL=mysql://root:password@localhost:3306/chatbot
DATABASE_USER=root
DATABASE_PASSWORD=password
DATABASE_NAME=chatbot
DATABASE_HOST=localhost
DATABASE_PORT=3306

PORT=3000
PYTHON_SERVER_URL=http://localhost:5001
```

## Install

From the repo root:

```bash
bun install
```

For the Python model service:

```bash
cd packages/models
pip install -r requirements.txt
```

## Database Setup

```bash
cd packages/server
bunx prisma migrate dev
bunx prisma generate
```

## Run The App

Start the Bun client/server dev processes from the repo root:

```bash
bun run index.ts
```

Start the Python model service in a second terminal:

```bash
cd packages/models
uvicorn search_kb:app --host 127.0.0.1 --port 5001
```

## Main Endpoints

### Chat

```http
POST /api/chat
Content-Type: application/json
```

```json
{
  "prompt": "tell me about ferrari what is the weather in tel aviv and convert 10 sheqels to dollar",
  "conversationId": "abc-123"
}
```

### Chat history

```http
POST /api/chat/history
DELETE /api/chat/history
```

### Plan debug

```http
POST /api/plan/create
```

### Python model service

```http
POST http://localhost:5001/classify
POST http://localhost:5001/search_kb
POST http://localhost:5001/answer_kb
```

Note: the server currently uses `/classify` and `/search_kb` in the main product-answer flow. `/answer_kb` still exists on the Python side but is no longer the primary product path.

## Supported Intents

- `weather`
- `exchange`
- `calculate`
- `products`
- `general`

Mixed prompts are supported. The planner splits the message into separate steps and the orchestrator combines the results back into one answer.

## Product Answering

Product requests now use a two-step flow:

1. Search the KB with `/search_kb`
2. Send the retrieved chunks to OpenAI for final answer generation

This keeps retrieval and answer generation separate and makes it easier to inspect timing and grounding.

## Model Timing In UI

Assistant messages can show per-model timing badges, for example:

- planner model timing
- product search KB timing
- OpenAI generation timing

Only timings already returned or measured by the current services are shown.

## Benchmarking

| Component | Model | Avg Response Time | Quality (1–5) | Cost |
| --- | --- | --- | --- | --- |
| Router & Planning | Ollama Qwen2.5:7b | ~70,000 ms (warm) | 4 | Free |
| Router & Planning (fallback) | OpenAI GPT-4.1 | ~1,500 ms | 5 | $ |
| General Chat | OpenAI GPT-4.1 | ~2,000 ms | 5 | $ |
| RAG Retrieval (KB Search) | HuggingFace nomic-embed-text | ~100 ms (warm) | 5 | Free |
| RAG Generation (Answer) | OpenAI GPT-4.1 | ~1,500 ms | 5 | $ |
| LLM Synthesis | OpenAI GPT-4.1-mini | ~2,000 ms | 5 | $ |

## Test Results

| Test | Prompt | Status |
| --- | --- | --- |
| Weather | `What is the weather in Paris?` | ✅ |
| Exchange | `Convert 50 GBP to ILS` | ✅ |
| Calculate | `Solve (18/3) + 2.5` | ✅ |
| Multi-intent | `Weather in Tokyo and convert 200 USD to ILS` | ✅ |
| RAG product | `Tell me about the MacBook Pro` | ✅ |
| RAG price | `What is the price of the Samsung TV?` | ✅ |
| RAG unknown | `What is the price of an iPhone?` | ✅ (not in KB) |
| RAG + Calculate | `How many Samsung TVs can I buy with the price of a Ferrari?` | ✅ |
| RAG + Calculate + Exchange | `How many MacBooks for the price of a Ferrari, convert to ILS?` | ✅ |
| Hebrew multi-intent | `מה מזג האוויר בתל אביב וכמה זה 100 דולר בשקלים?` | ✅ |
| General chat (joke) | `Tell me a joke` | ❌ |
| Plan intent | `Generate a workout plan` | ❌ |

### Failed Tests — Root Cause

**`Tell me a joke` / `ספר לי בדיחה`**
- Qwen classifies it as `general` intent → `orchestratorService.isAllGeneral()` returns `true` → goes to `chatService`
- `chatService` uses the system prompt from `prompts/chatbot.txt` which contains an overly restrictive safety instruction that blocks non-product questions

**`Generate a workout plan`**
- Qwen classifies it as `plan` intent → `orchestrator` has no `case 'plan'` in the switch → falls to `default: return { content: '' }`
- Empty result → synthesis returns nothing meaningful

## Notes

- Chat history is stored in the local `history/` folder with a short TTL.
- The planner prompt lives in `packages/models/system_instructions.json`.
- Product answer behavior is guided by `packages/server/prompts/rag_generation.txt` and `packages/models/product_answer_instructions.txt`.
