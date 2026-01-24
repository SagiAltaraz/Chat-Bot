# chat-bot

To install dependencies:

Go to root directory
```bash
bun install
```

To install prisma
```bash
cd ./packages/server
bunx prisma migrate dev
bunx prisma generate
```


To run:
Go to root directory
```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
