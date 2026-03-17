from pathlib import Path

DATA_DIR = Path("../../data/products")


def main():
    documents = sorted(DATA_DIR.glob("*.txt"))

    print("Embedding indexing is no longer used.")
    print(f"Found {len(documents)} product text files in {DATA_DIR}.")

    for file_path in documents:
        print(f"- {file_path.name}")


if __name__ == "__main__":
    main()
