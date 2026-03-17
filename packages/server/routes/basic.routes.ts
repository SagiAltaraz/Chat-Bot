import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
   res.send('Hello, World!');
});

router.get('/api/hello', (_req: Request, res: Response) => {
   res.json({ message: 'Hello from the API!' });
});

export default router;
