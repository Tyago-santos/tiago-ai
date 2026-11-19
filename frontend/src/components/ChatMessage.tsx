export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'border border-accent-green/40 bg-accent-green/15 text-heading'
            : 'border border-line bg-subtle text-heading'
        }`}
      >
        {!isUser && <span className="mb-1 block text-xs font-semibold text-accent-blue">Tiago AI</span>}
        {message.content}
      </div>
    </div>
  );
}
