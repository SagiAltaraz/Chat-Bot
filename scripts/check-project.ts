const BASE_URL = process.env.CHECK_PROJECT_BASE_URL || 'http://localhost:3000';
const CHAT_URL = `${BASE_URL}/api/chat`;

type ModelTiming = {
   model: string;
   responseTimeMs: number;
};

type ChatResponse = {
   message?: string;
   modelTimings?: ModelTiming[];
   error?: string;
};

type PromptCheck = {
   name: string;
   prompt: string;
   conversationId: string;
};

const sharedConversationId = crypto.randomUUID();

const checks: PromptCheck[] = [
   {
      name: 'General chat',
      prompt: 'Hi, how are you today?',
      conversationId: crypto.randomUUID(),
   },
   {
      name: 'Weather',
      prompt: 'What is the weather in Tel Aviv?',
      conversationId: crypto.randomUUID(),
   },
   {
      name: 'Exchange',
      prompt: 'Convert 10 ILS to USD',
      conversationId: crypto.randomUUID(),
   },
   {
      name: 'Math',
      prompt: 'What is 12 * (4 + 3)?',
      conversationId: crypto.randomUUID(),
   },
   {
      name: 'Product only',
      prompt: 'Tell me about Ferrari',
      conversationId: crypto.randomUUID(),
   },
   {
      name: 'Weather + exchange',
      prompt: 'What is the weather in Paris and convert 100 USD to ILS',
      conversationId: crypto.randomUUID(),
   },
   {
      name: 'Product + weather + exchange',
      prompt:
         'tell me about ferrari what is the weather in tel aviv and convert 10 sheqels to dollar',
      conversationId: crypto.randomUUID(),
   },
   {
      name: 'Conversation memory 1',
      prompt: 'Tell me about MacBook Pro',
      conversationId: sharedConversationId,
   },
   {
      name: 'Conversation memory 2',
      prompt: 'What about its battery life?',
      conversationId: sharedConversationId,
   },
   {
      name: 'Mixed greeting + logic',
      prompt: 'Hi, tell me a joke and convert 50 EUR to USD',
      conversationId: crypto.randomUUID(),
   },
];

async function main() {
   console.log(`Running project check against ${CHAT_URL}`);
   console.log(`Total prompts: ${checks.length}`);

   for (let index = 0; index < checks.length; index++) {
      const check = checks[index]!;
      const startedAt = Date.now();

      try {
         const response = await fetch(CHAT_URL, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               prompt: check.prompt,
               conversationId: check.conversationId,
            }),
         });

         const elapsedMs = Date.now() - startedAt;
         const body = (await response.json()) as ChatResponse;

         console.log('\n' + '='.repeat(80));
         console.log(`${index + 1}. ${check.name}`);
         console.log(`Prompt: ${check.prompt}`);
         console.log(`HTTP status: ${response.status}`);
         console.log(`End-to-end time: ${elapsedMs} ms`);

         if (!response.ok) {
            console.log(`Error: ${body.error ?? 'Unknown error'}`);
            throw new Error(`Request failed with status ${response.status}`);
         }

         console.log('Response:');
         console.log(body.message ?? '(empty)');

         console.log('Model timings:');
         if (!body.modelTimings?.length) {
            console.log('- none');
         } else {
            for (const timing of body.modelTimings) {
               console.log(
                  `- ${timing.model}: ${formatMs(timing.responseTimeMs)}`
               );
            }
         }
      } catch (error) {
         console.error('\n' + '='.repeat(80));
         console.error(`${index + 1}. ${check.name}`);
         console.error(`Prompt: ${check.prompt}`);
         console.error(
            `Request failed. Make sure the server is running at ${CHAT_URL}.`
         );
         throw error;
      }
   }

   console.log('\n' + '='.repeat(80));
   console.log('Project check completed.');
}

function formatMs(value: number): string {
   if (value < 1000) {
      return `${Math.round(value)} ms`;
   }

   return `${(value / 1000).toFixed(2)} s`;
}

await main();
