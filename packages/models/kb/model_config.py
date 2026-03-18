from pathlib import Path

# Shared configuration for the planner, embedding, chunking, and Chroma layers.
QWEN_MODEL = "qwen2.5:7b"
EMBEDDING_MODEL = "nomic-embed-text"
KB_DIR = Path(__file__).resolve().parent
BASE_DIR = KB_DIR.parent
DATA_DIR = (BASE_DIR / "../../data/products").resolve()
CHROMA_DIR = (BASE_DIR / ".chroma").resolve()
CHROMA_COLLECTION = "products_kb"
CHUNK_SIZE = 180
CHUNK_OVERLAP = 30
MAX_PRODUCT_MATCH_DISTANCE = 0.4
SYSTEM_INSTRUCTIONS_PATH = BASE_DIR / "system_instructions.json"
PRODUCT_ANSWER_INSTRUCTIONS_PATH = BASE_DIR / "product_answer_instructions.txt"
