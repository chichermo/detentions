'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, Download } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  defaultVisible?: boolean;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  defaultSort?: { key: keyof T | string; direction: 'asc' | 'desc' };
  itemsPerPage?: number;
  exportable?: boolean;
  exportFileName?: string;
}

export default function EnhancedTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  defaultSort,
  itemsPerPage = 25,
  exportable = false,
  exportFileName = 'export',
}: EnhancedTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(
    defaultSort || null
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(c => c.defaultVisible !== false).map(c => String(c.key)))
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: keyof T | string) => {
    if (sortConfig?.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const toggleColumn = (key: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleColumns(newVisible);
  };

  const exportToCSV = () => {
    const visibleCols = columns.filter(c => visibleColumns.has(String(c.key)));
    const headers = visibleCols.map(c => c.label).join(',');
    const rows = sortedData.map(row =>
      visibleCols.map(col => {
        const value = row[col.key as keyof T];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const visibleCols = columns.filter(c => visibleColumns.has(String(c.key)));

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {sortedData.length} resultaten
          </span>
          {totalPages > 1 && (
            <span className="text-sm text-slate-400">
              (Pagina {currentPage} van {totalPages})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
            >
              {showColumnMenu ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Kolommen
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-2 min-w-[200px]">
                {columns.map(col => (
                  <label key={String(col.key)} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(String(col.key))}
                      onChange={() => toggleColumn(String(col.key))}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-200">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {exportable && (
            <button
              onClick={exportToCSV}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exporteer
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              {visibleCols.map((col) => (
                <th
                  key={String(col.key)}
                  className={`text-left py-3 px-4 text-slate-300 font-semibold ${col.width || ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable !== false && (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <div className="flex flex-col">
                            <ChevronUp className="h-3 w-3 opacity-30" />
                            <ChevronDown className="h-3 w-3 opacity-30 -mt-1" />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length} className="py-8 text-center text-slate-400">
                  Geen resultaten gevonden
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-slate-800 hover:bg-slate-700/50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {visibleCols.map((col) => (
                    <td key={String(col.key)} className="py-3 px-4 text-slate-200">
                      {col.render
                        ? col.render(row[col.key as keyof T], row)
                        : String(row[col.key as keyof T] || '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vorige
          </button>
          <span className="text-sm text-slate-400">
            Pagina {currentPage} van {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volgende
          </button>
        </div>
      )}
    </div>
  );
}
