import OpenAI from 'openai';

const client = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});

type GenerateTextOptions = {
   model?: string;
   prompt: string;
   instructions?: string;
   temperature?: number;
   maxTokens?: number;
   previouseResponceId?: string;
   textFormat?: {
      type: 'json_object';
   };
};

export type ModelTiming = {
   model: string;
   responseTimeMs: number;
};

export type GenerateTextResult = {
   id: string;
   text: string;
   modelTimings?: ModelTiming[];
};

export const llmClient = {
   async generateText({
      model = 'gpt-4.1',
      prompt,
      instructions,
      temperature = 0.2,
      maxTokens = 300,
      previouseResponceId,
      textFormat,
   }: GenerateTextOptions): Promise<GenerateTextResult> {
      const startedAt = Date.now();
      const response = await client.responses.create({
         model,
         input: prompt,
         instructions,
         temperature,
         max_output_tokens: maxTokens,
         previous_response_id: previouseResponceId,
         ...(textFormat ? { text: { format: textFormat } } : {}),
      } as any);
      const responseTimeMs = Date.now() - startedAt;

      return {
         id: response.id,
         text: response.output_text,
         modelTimings: [
            {
               model: `OpenAI ${model}`,
               responseTimeMs,
            },
         ],
      };
   },
};
