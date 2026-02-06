import type { GenerateTextResult } from '../llm/openAiClient.js';
import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';

const conversations = new Map<string, string>();

export type Message = {
   id: string;
   role: 'user' | 'assistant';
   content: string;
};

export type Session = {
   conversationId: string;
   messages: {
      user: Message[];
      assistant: Message[];
   };
};

export const conversationRepository = {
   getLastResponseId(conversationId: string): string | undefined {
      return conversations.get(conversationId);
   },

   setLastResponseId(conversationId: string, responseId: string): void {
      conversations.set(conversationId, responseId);
   },

   async saveSession(
      conversationId: string,
      prompt: string,
      result: GenerateTextResult
   ): Promise<Session> {
      const session = await this.getSession(conversationId);
      this.addMessageToSession(result, session, prompt);
      await this.printSession(session);
      return session;
   },

   async printSession(session: Session) {
      try {
         await Bun.write(
            `./history/${session.conversationId}.json`,
            JSON.stringify(session)
         );
      } catch (error) {
         console.log(error);
      }
   },

   async getSession(conversationId: string): Promise<Session> {
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
   },

   addMessageToSession(
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
   },
};

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
