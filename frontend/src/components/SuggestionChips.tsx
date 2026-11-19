interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-accent-blue hover:text-accent-blue"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
