import { set } from 'zod';
import { cache } from '../cache';

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
   getMessage(
      conversationId: string,
      messageId: string
   ): Message[] | undefined {
      return cache.get(`${conversationId}:${messageId}`);
   },

   setMessage(
      conversationId: string,
      messageId: string,
      message: Message
   ): void {
      cache.set(`${conversationId}:${messageId}`, message);
   },
   getSession(conversationId: string): Session | undefined {
      return cache.get(conversationId);
   },
   setSession(conversationId: string, session: Session): void {
      cache.set(conversationId, session);
   },

   getLastResponseId(conversationId: string): string | undefined {
      console.log('repository');
      return cache.get(conversationId).lastMessage.id;
   },

   setLastResponseId(conversationId: string, responseId: string): void {
      cache.get(conversationId).lastMessage = this.getMessage(
         conversationId,
         responseId
      );
   },
};
