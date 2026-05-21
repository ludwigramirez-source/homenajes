import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PerformanceDataTable = ({ data, className = '' }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedData = [...data]?.sort((a, b) => {
    if (sortConfig?.direction === 'asc') {
      return a?.[sortConfig?.key] > b?.[sortConfig?.key] ? 1 : -1;
    }
    return a?.[sortConfig?.key] < b?.[sortConfig?.key] ? 1 : -1;
  });

  const filteredData = sortedData?.filter(item =>
    item?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    item?.city?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    item?.region?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData?.slice(startIndex, startIndex + itemsPerPage);

  const getQuartileColor = (quartile) => {
    const colors = {
      1: 'text-success',
      2: 'text-accent',
      3: 'text-warning',
      4: 'text-error'
    };
    return colors?.[quartile] || 'text-muted-foreground';
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) {
      return <Icon name="ChevronsUpDown" size={14} color="var(--color-muted-foreground)" />;
    }
    return (
      <Icon 
        name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
        size={14} 
        color="var(--color-accent)" 
      />
    );
  };

  const handleExport = () => {
    const csvContent = [
      ['Ranking', 'Ubicación', 'Ciudad', 'Región', 'Tributos/Mes', 'Engagement %', 'Satisfacción', 'Eficiencia COP', 'Cuartil'],
      ...filteredData?.map(item => [
        item?.rank,
        item?.name,
        item?.city,
        item?.region,
        item?.tributesPerMonth,
        item?.engagementRate,
        item?.satisfaction,
        item?.revenueEfficiency,
        `Q${item?.quartile}`
      ])
    ]?.map(row => row?.join(','))?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rendimiento_ubicaciones_${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    link?.click();
  };

  return (
    <div className={`bg-card border border-border rounded-lg shadow-elevation-sm ${className}`}>
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
              Comparación Detallada de Ubicaciones
            </h3>
            <p className="caption text-xs md:text-sm text-muted-foreground mt-1">
              {filteredData?.length} ubicaciones encontradas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={handleExport}
          >
            Exportar CSV
          </Button>
        </div>

        <div className="relative">
          <Icon 
            name="Search" 
            size={18} 
            color="var(--color-muted-foreground)" 
            className="absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Buscar por ubicación, ciudad o región..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e?.target?.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg
              caption text-sm text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th 
                onClick={() => handleSort('rank')}
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/80 transition-smooth"
              >
                <div className="flex items-center gap-2">
                  <span className="font-heading font-medium text-xs md:text-sm text-foreground">
                    Ranking
                  </span>
                  <SortIcon columnKey="rank" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/80 transition-smooth"
              >
                <div className="flex items-center gap-2">
                  <span className="font-heading font-medium text-xs md:text-sm text-foreground">
                    Ubicación
                  </span>
                  <SortIcon columnKey="name" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('city')}
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/80 transition-smooth hidden md:table-cell"
              >
                <div className="flex items-center gap-2">
                  <span className="font-heading font-medium text-xs md:text-sm text-foreground">
                    Ciudad
                  </span>
                  <SortIcon columnKey="city" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('tributesPerMonth')}
                className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-smooth"
              >
                <div className="flex items-center justify-end gap-2">
                  <span className="font-heading font-medium text-xs md:text-sm text-foreground">
                    Tributos/Mes
                  </span>
                  <SortIcon columnKey="tributesPerMonth" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('engagementRate')}
                className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-smooth hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-2">
                  <span className="font-heading font-medium text-xs md:text-sm text-foreground">
                    Engagement
                  </span>
                  <SortIcon columnKey="engagementRate" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('satisfaction')}
                className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-smooth hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-2">
                  <span className="font-heading font-medium text-xs md:text-sm text-foreground">
                    Satisfacción
                  </span>
                  <SortIcon columnKey="satisfaction" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('quartile')}
                className="px-4 py-3 text-center cursor-pointer hover:bg-muted/80 transition-smooth"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="font-heading font-medium text-xs md:text-sm text-foreground">
                    Cuartil
                  </span>
                  <SortIcon columnKey="quartile" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData?.map((item) => (
              <tr key={item?.id} className="hover:bg-muted/50 transition-smooth">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold text-sm text-foreground data-text">
                      #{item?.rank}
                    </span>
                    {item?.rank <= 3 && (
                      <Icon name="Award" size={14} color="var(--color-accent)" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-heading font-medium text-sm text-foreground">
                      {item?.name}
                    </div>
                    <div className="caption text-xs text-muted-foreground md:hidden">
                      {item?.city}, {item?.region}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="caption text-sm text-foreground">
                    {item?.city}
                  </div>
                  <div className="caption text-xs text-muted-foreground">
                    {item?.region}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-heading font-medium text-sm text-foreground data-text">
                    {item?.tributesPerMonth}
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className="font-heading font-medium text-sm text-foreground data-text">
                    {item?.engagementRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <Icon name="Star" size={14} color="var(--color-accent)" />
                    <span className="font-heading font-medium text-sm text-foreground data-text">
                      {item?.satisfaction}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-heading font-semibold text-sm ${getQuartileColor(item?.quartile)}`}>
                    Q{item?.quartile}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="p-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="caption text-xs text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData?.length)} de {filteredData?.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                iconName="ChevronLeft"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded caption text-xs font-medium transition-smooth
                        ${currentPage === pageNum
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                iconName="ChevronRight"
                iconPosition="right"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDataTable;