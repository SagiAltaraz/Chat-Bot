import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

type ModelTiming = {
   model: string;
   responseTimeMs: number;
};

export type Message = {
   content: string;
   role: 'user' | 'bot' | 'assistant';
   modelTimings?: ModelTiming[];
};

type Props = {
   messages: Message[];
};

export const ChatMessages = ({ messages }: Props) => {
   const lastMessageRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);

   const onCopyMessage = (e: React.ClipboardEvent<HTMLParagraphElement>) => {
      const selection = window.getSelection()?.toString().trim();
      if (selection) {
         e.preventDefault();
         e.clipboardData.setData('text/plain', selection);
      }
   };

   return (
      <div className="flex flex-col gap-3">
         {messages.map((message, index) => (
            <div
               key={index}
               onCopy={onCopyMessage}
               ref={index === messages.length - 1 ? lastMessageRef : null}
               className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm
               ${
                  message.role === 'user'
                     ? 'bg-blue-600 text-white self-end'
                     : 'bg-white text-black self-start border border-slate-200'
               }`}
            >
               <ReactMarkdown>{message.content}</ReactMarkdown>
               {message.role !== 'user' && message.modelTimings?.length && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                     <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        Model Timings
                     </p>
                     <div className="flex flex-wrap gap-2">
                        {message.modelTimings.map((timing) => (
                           <span
                              key={`${timing.model}-${timing.responseTimeMs}`}
                              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                           >
                              <span className="font-medium">
                                 {formatModelName(timing.model)}
                              </span>
                              <span className="text-slate-500">
                                 {formatResponseTime(timing.responseTimeMs)}
                              </span>
                           </span>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         ))}
      </div>
   );
};

function formatResponseTime(responseTimeMs: number): string {
   if (responseTimeMs < 1000) {
      return `${Math.round(responseTimeMs)} ms`;
   }

   return `${(responseTimeMs / 1000).toFixed(2)} s`;
}

function formatModelName(model: string): string {
   return model.replace(/^OpenAI\s+/, '');
}
