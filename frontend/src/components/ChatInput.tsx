interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled = false }: ChatInputProps) {
  const canSend = value.trim().length > 0 && !disabled;

  function submit() {
    if (canSend) onSend();
  }

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Escreva sua pergunta sobre Tiago…"
        rows={2}
        aria-label="Sua pergunta"
        className="flex-1 resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-heading placeholder:text-muted focus:border-accent-blue focus:outline-none"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <button
        type="submit"
        disabled={!canSend}
        className="rounded-lg bg-accent-green px-4 py-2.5 text-sm font-semibold text-canvas transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Enviar
      </button>
    </form>
  );
}
