import { conversationRepository } from '../repositories/conversation.repository.js';
import OpenAI from 'openai';
import template from '../prompts/chatbot.txt';
import projectInfo from '../prompts/neuroStep.txt';

const client = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});

const instructions = template.replace('{{projectInfo}}', projectInfo);

type ChatResponse = {
   id: string;
   massage: string;
};

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<ChatResponse> {
      const response = await client.responses.create({
         model: 'gpt-4o-mini',
         instructions,
         input: prompt,
         temperature: 0.2,
         max_output_tokens: 200,
         previous_response_id:
            conversationRepository.getLastResponseId(conversationId),
      });

      conversationRepository.setLastResponseId(conversationId, response.id);

      return {
         id: response.id,
         massage: response.output_text,
      };
   },
};
