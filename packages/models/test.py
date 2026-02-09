from sentence_transformers import SentenceTransformer
import chromadb

# anchors = [
#     ("What is the current temperature in London?", "weather"),
#     ("Is it going to rain in New York tomorrow?", "weather"),
#     ("Show me the 7-day weather forecast for Tokyo.", "weather"),
#     ("Will I need an umbrella today?", "weather"),
#     ("What are the wind speeds and humidity levels in Paris?", "weather"),
#     ("What is the current USD to EUR conversion rate?", "exchange"),
#     ("How many Yen can I get for 1000 Dollars?", "exchange"),
#     ("Show me the historical trend for GBP against the Euro.", "exchange"),
#     ("What is today's mid-market exchange rate for CAD?", "exchange"),
#     ("Is the Shekel strengthening against the Dollar right now?", "exchange"),
#     ("Calculate the conversion from AUD to Swiss Francs.", "exchange"),
# ]

# chroma_client = chromadb.Client()

# Download from the 🤗 Hub
model = SentenceTransformer("google/embeddinggemma-300m")

labels = ["weather", "exchange", "calculate"]
sentence = [
    "How much is 6 plus 2?",
    "What is the current temperature in London?",
    "How much is 50 Dollars in Sheqels?",
]

label_embeddings = model.encode(labels, prompt_name="Classification")
embeddings = model.encode(sentence, prompt_name="Classification")

similarities = model.similarity(embeddings, label_embeddings)

idx = similarities.argmax(1)
print(idx.numpy())

for example in sentence:
    print(
        "🙋‍♂️",
        example,
        "-> 🤖",
        labels[idx[sentence.index(example)]],
        "similarity:",
        similarities.numpy()[sentence.index(example)][idx[sentence.index(example)]],
    )

# # Run inference with queries and documents
# query = "what is the weather in paris?"
# documents = [
#     "What is the current temperature in London?",
#     "Is it going to rain in New York tomorrow?",
#     "Show me the 7-day weather forecast for Tokyo.",
#     "Will I need an umbrella today?",
#     "What are the wind speeds and humidity levels in Paris?",
# ]
# query_embeddings = model.encode_query(query)
# document_embeddings = model.encode_document(documents)
# print(query_embeddings.shape, document_embeddings.shape)
# # (768,) (4, 768)

# # Compute similarities to determine a ranking
# similarities = model.similarity(query_embeddings, document_embeddings)
# print(similarities)
# # tensor([[0.3011, 0.6359, 0.4930, 0.4889]])
