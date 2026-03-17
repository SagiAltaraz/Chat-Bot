import { conversationRepository } from '../repositories/conversation.repository';
import { llmClient } from '../llm/openAi/client.js';
import type { Message } from '../repositories/conversation.repository';
import instructions from '../prompts/instructions.txt';

export const chatService = {
   async generateReply(
      prompt: string,
      conversationId: string
   ): Promise<{ id: string; content: string }> {
      const isNewSession =
         !(await conversationRepository.hasSession(conversationId));

      const response = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions,
         prompt,
         temperature: 0.2,
         maxTokens: 200,
         previouseResponceId: isNewSession
            ? undefined
            : conversationRepository.getLastResponseId(conversationId),
      });

      return {
         id: response.id,
         content: response.text,
      };
   },

   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<Message | undefined> {
      const response = await this.generateReply(prompt, conversationId);
      conversationRepository.setLastResponseId(conversationId, response.id);
      const session = await conversationRepository.appendMessage(
         conversationId,
         prompt,
         {
            id: response.id,
            text: response.content,
         }
      );

      return session.messages.assistant[session.messages.assistant.length - 1];
   },
};
