import React, { useState } from 'react';
import { cn } from '../../utils/cn';

// Devuelve {from, to} en formato YYYY-MM-DD para los ultimos N dias.
const lastDays = (n) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - n);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
};

export const presetRange = lastDays;

// Selector de rango de fechas: 7d / 30d / 90d / personalizado.
// onChange recibe { from, to }. Diseñado para ir sobre el header teal (variant
// 'onDark') o sobre fondo claro (variant 'light').
const DateRangeControl = ({ value, onChange, variant = 'onDark' }) => {
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState(value?.from || lastDays(30).from);
  const [to, setTo] = useState(value?.to || lastDays(30).to);
  const [active, setActive] = useState(30);

  const onDark = variant === 'onDark';

  const pick = (days) => {
    setActive(days);
    setCustom(false);
    onChange(lastDays(days));
  };

  const applyCustom = () => {
    if (from && to) { setActive(null); onChange({ from, to }); }
  };

  const presets = [
    { label: '7 días', days: 7 },
    { label: '30 días', days: 30 },
    { label: '90 días', days: 90 }
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className={cn('flex items-center rounded-md overflow-hidden border',
        onDark ? 'border-white/25' : 'border-border')}>
        {presets.map((p, i) => (
          <button
            key={p.days}
            onClick={() => pick(p.days)}
            className={cn(
              'px-3 py-1.5 text-sm transition-colors',
              i > 0 && (onDark ? 'border-l border-white/25' : 'border-l border-border'),
              active === p.days && !custom
                ? (onDark ? 'bg-white/20 text-white font-medium' : 'bg-primary text-white font-medium')
                : (onDark ? 'text-white/80 hover:bg-white/10' : 'text-foreground hover:bg-muted')
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setCustom(c => !c)}
          className={cn(
            'px-3 py-1.5 text-sm transition-colors',
            onDark ? 'border-l border-white/25' : 'border-l border-border',
            custom
              ? (onDark ? 'bg-white/20 text-white font-medium' : 'bg-primary text-white font-medium')
              : (onDark ? 'text-white/80 hover:bg-white/10' : 'text-foreground hover:bg-muted')
          )}
        >
          Personalizado
        </button>
      </div>

      {custom && (
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-sm" />
          <span className={onDark ? 'text-white/70' : 'text-muted-foreground'}>—</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-sm" />
          <button onClick={applyCustom}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-primary"
            style={{ background: '#ffffff' }}>
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangeControl;
