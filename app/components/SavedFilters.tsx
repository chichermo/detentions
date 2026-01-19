'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, FolderOpen, X } from 'lucide-react';
import { getSavedFilters, saveFilter, deleteFilter, SavedFilter } from '@/lib/filters';
import { SearchFilters } from './AdvancedSearch';

interface SavedFiltersProps {
  currentFilters: SearchFilters;
  onLoadFilter: (filters: SearchFilters) => void;
}

export default function SavedFilters({ currentFilters, onLoadFilter }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = () => {
    setSavedFilters(getSavedFilters());
  };

  const handleSave = () => {
    if (!filterName.trim()) return;
    saveFilter(filterName, currentFilters);
    setFilterName('');
    setShowSaveDialog(false);
    loadFilters();
  };

  const handleDelete = (id: string) => {
    if (confirm('Weet je zeker dat je dit filter wilt verwijderen?')) {
      deleteFilter(id);
      loadFilters();
    }
  };

  const handleLoad = (filter: SavedFilter) => {
    onLoadFilter(filter.filters);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowSaveDialog(true)}
        className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        Opslaan
      </button>

      {savedFilters.length > 0 && (
        <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 min-w-[250px] max-h-[400px] overflow-y-auto">
          <div className="p-2 border-b border-slate-700">
            <h4 className="text-sm font-semibold text-slate-200 px-2 py-1">Opgeslagen Filters</h4>
          </div>
          {savedFilters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center justify-between p-2 hover:bg-slate-700 group"
            >
              <button
                onClick={() => handleLoad(filter)}
                className="flex items-center gap-2 flex-1 text-left text-sm text-slate-200 hover:text-indigo-400"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="truncate">{filter.name}</span>
              </button>
              <button
                onClick={() => handleDelete(filter.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100">Filter Opslaan</h3>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName('');
                }}
                className="btn-ghost p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Naam van het filter"
              className="input-field mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={handleSave} className="btn-primary flex-1">
                Opslaan
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName('');
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
