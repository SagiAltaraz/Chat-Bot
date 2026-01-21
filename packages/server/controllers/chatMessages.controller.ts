import type { Request, Response } from 'express';
import type { Session, Message } from '../repositories/conversation.repository';

export const chatMessagesController = {
   async getMessages(req: Request, res: Response) {
      try {
         const { conversationId } = req.body;
         const session = (await Bun.file(
            `./history/${conversationId}.json`
         ).json()) as Session;
         res.json({
            botMessages: session.messages.assistant,
            userMessages: session.messages.user,
         });
      } catch (error) {
         console.log(error);
      }
   },
};
