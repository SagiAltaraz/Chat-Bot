import { mkdir, unlink } from 'node:fs/promises';
import type { GenerateTextResult, ModelTiming } from '../llm/openAi/client.js';

const HISTORY_DIR = './history';
const SESSION_TTL_MS = 5 * 60 * 1000;
const lastResponseIds = new Map<string, string>();

export type Message = {
   id: string;
   role: 'user' | 'assistant';
   content: string;
   modelTimings?: ModelTiming[];
};

export type Session = {
   conversationId: string;
   expiresAt: string;
   messages: {
      user: Message[];
      assistant: Message[];
   };
};

export const conversationRepository = {
   getLastResponseId(conversationId: string): string | undefined {
      return lastResponseIds.get(conversationId);
   },

   setLastResponseId(conversationId: string, responseId: string): void {
      lastResponseIds.set(conversationId, responseId);
   },

   async hasSession(conversationId: string): Promise<boolean> {
      return Boolean(await this.getSession(conversationId));
   },

   async getSession(conversationId: string): Promise<Session | null> {
      const path = getSessionPath(conversationId);
      const file = Bun.file(path);

      if (!(await file.exists())) {
         return null;
      }

      const session = normalizeSession((await file.json()) as Session);

      if (isExpired(session)) {
         await deleteSessionFile(path);
         lastResponseIds.delete(conversationId);
         return null;
      }

      return session;
   },

   async ensureSession(conversationId: string): Promise<Session> {
      return (
         (await this.getSession(conversationId)) ??
         createSession(conversationId)
      );
   },

   async deleteSession(conversationId: string): Promise<void> {
      lastResponseIds.delete(conversationId);
      await deleteSessionFile(getSessionPath(conversationId));
   },

   async saveSession(session: Session): Promise<Session> {
      await ensureHistoryDir();
      await Bun.write(
         getSessionPath(session.conversationId),
         JSON.stringify(session)
      );
      return session;
   },

   async appendMessage(
      conversationId: string,
      prompt: string,
      response: GenerateTextResult
   ): Promise<Session> {
      return this.appendTurn(
         conversationId,
         prompt,
         response.text,
         response.id
      );
   },

   async appendTurn(
      conversationId: string,
      prompt: string,
      assistantMessage: string,
      assistantMessageId: string = crypto.randomUUID(),
      modelTimings?: ModelTiming[]
   ): Promise<Session> {
      const session = await this.ensureSession(conversationId);

      session.messages.user.push(toUserMessage(assistantMessageId, prompt));
      session.messages.assistant.push(
         toAssistantMessage({
            id: assistantMessageId,
            text: assistantMessage,
            modelTimings,
         })
      );
      session.expiresAt = createExpiresAt();

      return this.saveSession(session);
   },
};

function getSessionPath(conversationId: string): string {
   return `${HISTORY_DIR}/${conversationId}.json`;
}

async function ensureHistoryDir(): Promise<void> {
   await mkdir(HISTORY_DIR, { recursive: true });
}

function createSession(conversationId: string): Session {
   return {
      conversationId,
      expiresAt: createExpiresAt(),
      messages: {
         user: [],
         assistant: [],
      },
   };
}

function normalizeSession(session: Session): Session {
   return {
      ...session,
      expiresAt: session.expiresAt ?? createExpiresAt(),
   };
}

function createExpiresAt(): string {
   return new Date(Date.now() + SESSION_TTL_MS).toISOString();
}

function isExpired(session: Session): boolean {
   return Date.parse(session.expiresAt) <= Date.now();
}

function toUserMessage(id: string, content: string): Message {
   return {
      id: String(id),
      role: 'user',
      content,
   };
}

function toAssistantMessage(response: GenerateTextResult): Message {
   return {
      id: String(response.id),
      role: 'assistant',
      content: response.text,
      modelTimings: response.modelTimings,
   };
}

async function deleteSessionFile(path: string): Promise<void> {
   try {
      await unlink(path);
   } catch {
      // Ignore missing/locked files during expiry cleanup.
   }
}
