import { conversationRepository } from '../repositories/conversation.repository';
import template from '../prompts/chatbot.txt';
import projectInfo from '../prompts/neuroStep.txt';
import { llmClient } from '../llm/client.js';
import type { GenerateTextResult } from '../llm/client.js';
import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import type {
   Session,
   Message,
} from '../repositories/conversation.repository copy.js';
const instructions = template.replace('{{projectInfo}}', projectInfo);

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<Message | undefined> {
      const response = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions,
         prompt,
         temperature: 0.2,
         maxTokens: 200,
         previouseResponceId:
            conversationRepository.getLastResponseId(conversationId),
      });

      const session = await getSession(response, conversationId, prompt);

      addMessageToSession(response, session, prompt);
      printSession(session);
      return session.messages.assistant[session.messages.assistant.length - 1];
   },
};

async function printSession(session: Session) {
   try {
      await Bun.write(
         `./history/${session.conversationId}.json`,
         JSON.stringify(session)
      );
   } catch (error) {
      console.log(error);
   }
}

function addMessageToSession(
   response: GenerateTextResult,
   session: Session,
   prompt: string
) {
   session.messages.assistant.push({
      id: `${response.id}`,
      content: response.text,
      role: 'assistant',
   });
   session.messages.user.push({
      id: `${response.id}`,
      content: prompt,
      role: 'user',
   });
}

async function historyIsExist() {
   try {
      await access('./history', constants.F_OK);
      return true;
   } catch (e) {
      return false;
   }
}

async function conversationIsExist(path: string) {
   try {
      return await Bun.file(path).exists();
   } catch (e) {
      console.log(e);
   }
}

async function getSession(
   response: GenerateTextResult,
   conversationId: string,
   prompt: string
): Promise<Session> {
   if (!(await historyIsExist())) {
      await mkdir('./history', { recursive: true });
      console.log('history dir created');
      return createNewSession(conversationId);
   }
   if (!(await conversationIsExist(`./history/${conversationId}.json`))) {
      console.log('conversation dir created');
      return createNewSession(conversationId);
   } else {
      return (await Bun.file(
         `./history/${conversationId}.json`
      ).json()) as Session;
   }
}

function createNewSession(conversationId: string): Session {
   const session: Session = {
      conversationId,
      messages: {
         user: [],
         assistant: [],
      },
   };
   return session;
}
