import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CURRENCIES, getCurrency, setCurrency } from '@/lib/currency';

interface CurrencySelectorProps {
  onChange?: () => void;
}

export function CurrencySelector({ onChange }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(getCurrency());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    setCurrency(code);
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) setSelected(found);
    setOpen(false);
    onChange?.();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
      >
        <span className="text-base font-bold">{selected.symbol}</span>
        <span className="hidden sm:inline">{selected.code}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl z-50 overflow-hidden animate-fade-in">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleSelect(c.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-700 ${
                selected.code === c.code ? 'text-sky-400' : 'text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base font-bold w-5">{c.symbol}</span>
                {c.label}
              </span>
              {selected.code === c.code && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
