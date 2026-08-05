import React from 'react';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

export const DEFAULT_PAGE_SIZE = 20;

// Numeros de pagina a mostrar alrededor de la actual, con "…" para saltos
// (ej. [1, '…', 4, 5, 6, '…', 20]). Evita renderizar cientos de botones
// cuando hay muchas paginas. Mismo criterio usado en Tablon de mensajes y Books.
export const getPageNumbers = (current, total) => {
  const delta = 1;
  const pages = [];
  const rangeStart = Math.max(2, current - delta);
  const rangeEnd = Math.min(total - 1, current + delta);
  pages.push(1);
  if (rangeStart > 2) pages.push('…');
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < total - 1) pages.push('…');
  if (total > 1) pages.push(total);
  return pages;
};

// Pagina en cliente un array ya filtrado/ordenado. Si el array se encoge
// (ej. un filtro nuevo) y la pagina actual queda fuera de rango, se recorta
// sola al maximo valido - pero para volver a la pagina 1 al cambiar un
// filtro, el que llama debe invocar setPage(1) explicitamente (ver
// TributesList/RoomsTab/LocationsTab).
export function usePagination(items, pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = React.useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );
  return { page: safePage, setPage, totalPages, pageItems, pageSize };
}

// Barra Anterior/numeros/Siguiente. No se renderiza si solo hay 1 pagina.
export const Pagination = ({ page, totalPages, onChange, className }) => {
  if (totalPages <= 1) return null;
  return (
    <div className={cn("pt-4 flex items-center justify-between gap-3 flex-wrap border-t border-border", className)}>
      <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
        >
          <Icon name="ChevronLeft" size={14} /> Anterior
        </button>
        {getPageNumbers(page, totalPages).map((p, i) => (
          p === '…' ? (
            <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                "min-w-[34px] px-2 py-1.5 rounded-md text-sm transition-colors",
                p === page ? "bg-primary text-white" : "border border-border text-foreground hover:bg-muted"
              )}
            >
              {p}
            </button>
          )
        ))}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
        >
          Siguiente <Icon name="ChevronRight" size={14} />
        </button>
      </div>
    </div>
  );
};
