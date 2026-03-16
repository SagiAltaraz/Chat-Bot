# Chat Bot

A multi-intent AI chat assistant built with a **Bun + Express + React** monorepo.
The bot understands natural language, classifies intent, and routes requests to specialized services — weather, currency exchange, math, product knowledge base (RAG), and general conversation.

---

## Architecture

```
User Message
     │
     ▼
Intent Classification (OpenAI + Ollama/ChromaDB)
     │
     ▼
Plan Creation  ──►  Orchestrator
                        │
           ┌────────────┼────────────┐────────────┐
           ▼            ▼            ▼            ▼
        Weather      Exchange      Math         RAG
        Service      Service      Service     (Python)
                                              ChromaDB
```

The orchestrator executes multi-step plans in parallel, then synthesizes a final answer using the results.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) v1.3.5+ |
| Backend | Express 5, TypeScript |
| Frontend | React 19, Vite, Tailwind CSS |
| LLM | OpenAI gpt-4o-mini / gpt-4.1 |
| Vector DB | ChromaDB (Python / FastAPI) |
| Embeddings | sentence-transformers `all-MiniLM-L6-v2` |
| Classification | Ollama `qwen2.5:7b` |
| Database | MySQL / MariaDB via Prisma |
| Math | mathjs |

---

## Project Structure

```
chat-bot/
├── packages/
│   ├── client/          # React frontend
│   ├── server/          # Express API + services
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── orchestrator.service.ts   # Plan execution engine
│   │   │   ├── intent.service.ts         # Intent classification
│   │   │   ├── productInformation.service.ts  # RAG
│   │   │   ├── weather.service.ts
│   │   │   ├── exchange.service.ts
│   │   │   ├── math_translator.service.ts
│   │   │   └── review.service.ts
│   │   └── repositories/
│   └── models/          # Python FastAPI server
│       ├── search_kb.py # Serve: /classify + /search_kb
│       └── index_kb.py  # Index product docs into ChromaDB
├── data/
│   └── products/        # .txt product knowledge base files
└── .env
```

---

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.3.5+
- Python 3.10+
- MySQL / MariaDB
- [Ollama](https://ollama.ai) with `qwen2.5:7b` pulled

### 1. Install dependencies

```bash
# From root
bun install

# Python dependencies
cd packages/models
pip install -r requirements.txt
```

### 2. Configure environment

Create a `.env` file in the root:

```env
OPENAI_API_KEY=sk-...
WEATHER_API_KEY=...

DATABASE_URL=mysql://root:admin@localhost:3306/review_summarizer
DATABASE_USER=root
DATABASE_PASSWORD=admin
DATABASE_NAME=review_summarizer
DATABASE_HOST=localhost
DATABASE_PORT=3306

PORT=3000
PYTHON_SERVER_URL=http://localhost:5001
```

### 3. Set up the database

```bash
cd packages/server
bunx prisma migrate dev
bunx prisma generate
```

### 4. Index the knowledge base

```bash
cd packages/models
python index_kb.py
```

### 5. Start all services

```bash
# Terminal 1 — Express server + React client
bun run index.ts

# Terminal 2 — Python RAG server
cd packages/models
uvicorn search_kb:app --port 5001
```

---

## API Reference

### Chat

```bash
POST /api/chat
{ "prompt": "Weather in Paris and convert 100 USD to ILS", "conversationId": "abc" }
```

### Plan (debug)

```bash
POST /api/plan/create
{ "prompt": "Weather in Paris and convert 100 USD to ILS" }
```

### Direct endpoints

```bash
GET  /api/weather/:city
GET  /api/calculate/:equation
GET  /api/exchangerate/:target

GET  /api/products/:id/reviews
POST /api/products/:id/reviews/summarize

POST /api/getMessages   { "conversationId": "abc" }
```

### Python server

```bash
POST http://localhost:5001/classify   { "prompt": "Do you have laptops?" }
POST http://localhost:5001/search_kb  { "query": "MacBook Pro specs", "n_results": 3 }
```

---

## Supported Intents

| Intent | Example prompt |
|--------|---------------|
| `weather` | "What's the weather in Tokyo?" |
| `exchange` | "Convert 50 EUR to USD" |
| `calculate` | "What is 12 * (4 + 3)?" |
| `products` | "Tell me about the MacBook Pro" |
| `general` | "Tell me a joke" |

Multi-intent prompts are fully supported — the bot will run all relevant tools and combine the results.
