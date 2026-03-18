import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import TypingIndicator from './TypingIndicator';
import { ChatMessages, type Message } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ChatFormData } from './ChatInput';
import { Button } from '@/components/ui/button';
import popSound from '@/assets/sounds/pop.mp3';
import notificationSound from '@/assets/sounds/notification.mp3';
import Cookies from 'js-cookie';

const popAudio = new Audio(popSound);
popAudio.volume = 0.2;

const notificationAudio = new Audio(notificationSound);
notificationAudio.volume = 0.2;

type ChatResponse = {
   message?: string;
   modelTimings?: Message['modelTimings'];
};

type HistoryResponse = {
   messages: Message[];
};

const ChatBot = () => {
   const [messages, setMessages] = useState<Message[]>([]);
   const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);
   const conversationId = useRef(
      Cookies.get('conversationId') ?? crypto.randomUUID()
   );

   useEffect(() => {
      Cookies.set('conversationId', conversationId.current, { expires: 30 });
   }, []);

   useEffect(() => {
      let ignore = false;

      async function fetchMessages() {
         try {
            const { data } = await axios.post<HistoryResponse>(
               '/api/chat/history',
               {
                  conversationId: conversationId.current,
               }
            );

            if (ignore) {
               return;
            }

            setMessages(data.messages);
         } catch (error) {
            console.error(error);
         }
      }

      fetchMessages();

      return () => {
         ignore = true;
      };
   }, []);

   const onSubmit = async ({ prompt }: ChatFormData) => {
      try {
         setMessages((prev) => [...prev, { content: prompt, role: 'user' }]);
         setIsBotTyping(true);
         setError('');
         popAudio.play();

         const { data } = await axios.post<ChatResponse>('/api/chat', {
            prompt,
            conversationId: conversationId.current,
         });

         setMessages((prev) => [
            ...prev,
            {
               content: data.message ?? '',
               role: 'bot',
               modelTimings: data.modelTimings,
            },
         ]);
         setIsBotTyping(false);
         notificationAudio.play();
      } catch (error) {
         console.error(error);
         setError('Something went wrong. Please try again.');
      } finally {
         setIsBotTyping(false);
      }
   };

   const clearChat = async () => {
      try {
         await axios.delete('/api/chat/history', {
            data: { conversationId: conversationId.current },
         });
      } catch (error) {
         console.error(error);
      } finally {
         conversationId.current = crypto.randomUUID();
         Cookies.set('conversationId', conversationId.current, { expires: 30 });
         setMessages([]);
         setError(null);
      }
   };

   return (
      <div className="flex flex-col h-full">
         <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Chat history</p>
            <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={clearChat}
            >
               Clear chat
            </Button>
         </div>
         <div className="flex flex-col flex-1 gap-3 mb-10 overflow-y-auto">
            <ChatMessages messages={messages} />
            {isBotTyping && <TypingIndicator />}
            {error && <p className="text-red-500">{error}</p>}
         </div>
         <ChatInput onSubmit={onSubmit} />
      </div>
   );
};
export default ChatBot;
