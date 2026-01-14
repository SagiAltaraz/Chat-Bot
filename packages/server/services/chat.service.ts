import { conversationRepository } from '../repositories/conversation.repository.js';
import template from '../prompts/chatbot.txt';
import projectInfo from '../prompts/neuroStep.txt';
import { llmClient } from '../llm/client.js';

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
      const response = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions,
         prompt,
         temperature: 0.2,
         maxTokens: 200,
         previouseResponceId:
            conversationRepository.getLastResponseId(conversationId),
      });

      conversationRepository.setLastResponseId(conversationId, response.id);
      console.log(conversationRepository.logMap());
      return {
         id: response.id,
         massage: response.text,
      };
   },
};
