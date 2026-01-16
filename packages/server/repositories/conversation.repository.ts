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
};
