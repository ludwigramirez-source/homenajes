import React, { useMemo, useState } from 'react';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

// Hook de ordenamiento para tablas. `accessors` mapea cada key de columna a una
// funcion que extrae el valor a comparar (numerico o texto). Click alterna
// asc -> desc -> asc sobre la misma columna.
export function useTableSort(rows, accessors = {}, initial = { key: null, dir: 'asc' }) {
  const [sort, setSort] = useState(initial);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const acc = accessors[sort.key] || ((r) => r?.[sort.key]);
    const copy = [...rows];
    copy.sort((a, b) => {
      let va = acc(a);
      let vb = acc(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return va - vb;
      }
      va = (va === null || va === undefined) ? '' : String(va).toLowerCase();
      vb = (vb === null || vb === undefined) ? '' : String(vb).toLowerCase();
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    });
    if (sort.dir === 'desc') copy.reverse();
    return copy;
  }, [rows, sort, accessors]);

  const toggle = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return { sorted, sort, toggle };
}

// Celda de encabezado ordenable. Muestra una flecha segun el estado.
export const SortTh = ({ label, sortKey, sort, onSort, align = 'left', className }) => {
  const active = sort.key === sortKey;
  const iconName = !active ? 'ChevronsUpDown' : sort.dir === 'asc' ? 'ChevronUp' : 'ChevronDown';
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        'font-medium px-4 py-3 select-none cursor-pointer hover:text-foreground transition-colors',
        align === 'right' ? 'text-right' : 'text-left',
        className
      )}
      title="Ordenar"
    >
      <span className={cn('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
        {label}
        <Icon name={iconName} size={13} className={active ? 'text-primary' : 'opacity-40'} />
      </span>
    </th>
  );
};
