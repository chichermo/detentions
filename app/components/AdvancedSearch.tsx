'use client';

import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  placeholder?: string;
}

export interface SearchFilters {
  text: string;
  student?: string;
  teacher?: string;
  reason?: string;
  dateFrom?: string;
  dateTo?: string;
  dayOfWeek?: string;
  hasChromebook?: boolean | null;
  shouldPrint?: boolean | null;
}

export default function AdvancedSearch({ onSearch, placeholder = "Zoeken..." }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ text: '' });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const cleared = { text: '' };
    setFilters(cleared);
    onSearch(cleared);
  };

  return (
    <div className="card p-4 sm:p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Search className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-slate-100">Geavanceerd Zoeken</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto btn-ghost text-sm"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.text}
            onChange={(e) => handleFilterChange('text', e.target.value)}
            placeholder={placeholder}
            className="input-field pl-12"
          />
          {filters.text && (
            <button
              onClick={() => handleFilterChange('text', '')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {(filters.student || filters.teacher || filters.reason || filters.dateFrom || filters.dateTo || filters.dayOfWeek || filters.hasChromebook !== null || filters.shouldPrint !== null) && (
          <button
            onClick={clearFilters}
            className="btn-secondary text-sm px-4"
          >
            Wissen
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Leerling</label>
            <input
              type="text"
              value={filters.student || ''}
              onChange={(e) => handleFilterChange('student', e.target.value)}
              placeholder="Naam leerling"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Leerkracht</label>
            <input
              type="text"
              value={filters.teacher || ''}
              onChange={(e) => handleFilterChange('teacher', e.target.value)}
              placeholder="Naam leerkracht"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Reden</label>
            <input
              type="text"
              value={filters.reason || ''}
              onChange={(e) => handleFilterChange('reason', e.target.value)}
              placeholder="Zoek in redenen"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Dag</label>
            <select
              value={filters.dayOfWeek || ''}
              onChange={(e) => handleFilterChange('dayOfWeek', e.target.value || undefined)}
              className="input-field"
            >
              <option value="">Alle dagen</option>
              <option value="MAANDAG">MAANDAG</option>
              <option value="DINSDAG">DINSDAG</option>
              <option value="DONDERDAG">DONDERDAG</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Van Datum</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tot Datum</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Chromebook</label>
            <select
              value={filters.hasChromebook === null ? '' : filters.hasChromebook ? 'yes' : 'no'}
              onChange={(e) => handleFilterChange('hasChromebook', e.target.value === '' ? null : e.target.value === 'yes')}
              className="input-field"
            >
              <option value="">Alle</option>
              <option value="yes">Met chromebook</option>
              <option value="no">Zonder chromebook</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Print</label>
            <select
              value={filters.shouldPrint === null ? '' : filters.shouldPrint ? 'yes' : 'no'}
              onChange={(e) => handleFilterChange('shouldPrint', e.target.value === '' ? null : e.target.value === 'yes')}
              className="input-field"
            >
              <option value="">Alle</option>
              <option value="yes">Te printen</option>
              <option value="no">Niet te printen</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
