import { FaArrowUp } from 'react-icons/fa';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import type { KeyboardEvent, MouseEvent } from 'react';

export type ChatFormData = {
   prompt: string;
};

type Props = {
   onSubmit: (data: ChatFormData) => void;
   disabled?: boolean;
};

export const ChatInput = ({ onSubmit }: Props) => {
   const { register, handleSubmit, reset, formState } = useForm<ChatFormData>();
   const submit = handleSubmit((data) => {
      reset({ prompt: '' });
      onSubmit(data);
   });

   const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         submit();
         e.preventDefault();
      }
   };

   const handleClick = (e: MouseEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.currentTarget.querySelector('textarea')?.focus();
   };

   return (
      <form
         onSubmit={submit}
         onKeyDown={handleKeyDown}
         onClick={handleClick}
         className="flex flex-col gap-2 items-end border-2 p-4 rounded-3xl"
      >
         <textarea
            className="w-full border-0 focus:outline-0 resize-none no-select"
            maxLength={1000}
            autoFocus
            {...register('prompt', {
               required: true,
               validate: (data) => data.trim().length > 0,
            })}
            placeholder="Ask something..."
         />
         <Button disabled={!formState.isValid} className="rounded-full w-9 h-9">
            <FaArrowUp />
         </Button>
      </form>
   );
};
