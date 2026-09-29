import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onChange]);

  return (
    <div className="search-bar">
      <Search className="search-icon" size={17} aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search your sites…"
        aria-label="Search sites"
        spellCheck={false}
      />
      {value ? (
        <button className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={15} />
        </button>
      ) : (
        <kbd className="search-kbd" aria-hidden="true">Ctrl K</kbd>
      )}
    </div>
  );
}
