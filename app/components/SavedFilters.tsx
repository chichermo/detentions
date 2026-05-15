'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, FolderOpen } from 'lucide-react';
import { getSavedFilters, saveFilter, deleteFilter, SavedFilter } from '@/lib/filters';
import { SearchFilters } from './AdvancedSearch';
import Modal from '@/app/components/ui/Modal';

interface SavedFiltersProps {
  currentFilters: SearchFilters;
  onLoadFilter: (filters: SearchFilters) => void;
}

export default function SavedFilters({ currentFilters, onLoadFilter }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setShowSaveDialog(true)}
        className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        Opslaan
      </button>

      {savedFilters.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
            aria-expanded={menuOpen}
          >
            <FolderOpen className="h-4 w-4" />
            Opgeslagen ({savedFilters.length})
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="dropdown-backdrop"
                aria-label="Menu sluiten"
                onClick={() => setMenuOpen(false)}
              />
              <ul className="dropdown-menu left-0 min-w-[250px]">
                {savedFilters.map((filter) => (
                  <li key={filter.id} className="flex items-center gap-1 group px-1">
                    <button
                      type="button"
                      onClick={() => handleLoad(filter)}
                      className="dropdown-item flex-1 flex items-center gap-2"
                    >
                      <FolderOpen className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="truncate">{filter.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(filter.id)}
                      className="p-2 text-[var(--coral)] opacity-70 group-hover:opacity-100 shrink-0"
                      aria-label="Verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <Modal
        open={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setFilterName('');
        }}
        title="Filter opslaan"
        footer={
          <>
            <button type="button" onClick={handleSave} className="btn-primary flex-1">
              Opslaan
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSaveDialog(false);
                setFilterName('');
              }}
              className="btn-secondary"
            >
              Annuleren
            </button>
          </>
        }
      >
        <input
          type="text"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="Naam van het filter"
          className="input-field w-full"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      </Modal>
    </div>
  );
}
