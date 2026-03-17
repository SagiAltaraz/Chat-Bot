import { z } from 'zod';

const PromptSchema = z.object({
   prompt: z.string().min(1).max(4000),
   conversationId: z.string().min(1).max(255).optional(),
});

export const validatePrompt = (req: any, _res: any, next: any) => {
   req.body = PromptSchema.parse(req.body);

   // Only normalize (NOT sanitize again)
   req.body.prompt = req.body.prompt.trim().replace(/\s+/g, ' ');

   next();
};
