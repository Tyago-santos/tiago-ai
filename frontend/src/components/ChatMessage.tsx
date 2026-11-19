import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function ExternalLink({
  href,
  children,
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  const external = href?.startsWith('http');
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      {children}
    </a>
  );
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'whitespace-pre-wrap border border-accent-green/40 bg-accent-green/15 text-heading'
            : 'border border-line bg-subtle text-heading'
        }`}
      >
        {!isUser && <span className="mb-1 block text-xs font-semibold text-accent-blue">Tiago AI</span>}
        {isUser ? (
          message.content
        ) : (
          <div className="chat-md prose prose-invert prose-sm max-w-none break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ExternalLink }}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
