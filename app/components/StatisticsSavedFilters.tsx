'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, FolderOpen } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';

export type StatisticsFilterState = {
  filterType: 'day' | 'month' | 'year' | 'custom';
  selectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  customStartDate: string;
  customEndDate: string;
};

interface SavedStatsFilter {
  id: string;
  name: string;
  filters: StatisticsFilterState;
  createdAt: string;
}

const STORAGE_KEY = 'nablijven_stats_filters';

function getSaved(): SavedStatsFilter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(list: SavedStatsFilter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

interface StatisticsSavedFiltersProps {
  current: StatisticsFilterState;
  onLoad: (filters: StatisticsFilterState) => void;
}

export default function StatisticsSavedFilters({ current, onLoad }: StatisticsSavedFiltersProps) {
  const [saved, setSaved] = useState<SavedStatsFilter[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    setSaved(getSaved());
  }, []);

  const handleSave = () => {
    if (!name.trim()) return;
    const next = [
      ...getSaved(),
      {
        id: `stats-filter-${Date.now()}`,
        name: name.trim(),
        filters: current,
        createdAt: new Date().toISOString(),
      },
    ];
    persist(next);
    setSaved(next);
    setName('');
    setShowSave(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Filter verwijderen?')) return;
    const next = getSaved().filter((f) => f.id !== id);
    persist(next);
    setSaved(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setShowSave(true)} className="btn-secondary text-sm px-3 py-2 flex items-center gap-2">
        <Save className="h-4 w-4" />
        Filter opslaan
      </button>
      {saved.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
            aria-expanded={menuOpen}
          >
            <FolderOpen className="h-4 w-4" />
            Opgeslagen ({saved.length})
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="dropdown-backdrop"
                aria-label="Menu sluiten"
                onClick={() => setMenuOpen(false)}
              />
              <ul className="dropdown-menu left-0 min-w-[220px]">
                {saved.map((f) => (
                  <li key={f.id} className="flex items-center gap-1 group px-1">
                    <button
                      type="button"
                      onClick={() => {
                        onLoad(f.filters);
                        setMenuOpen(false);
                      }}
                      className="dropdown-item flex-1"
                    >
                      {f.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
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
        open={showSave}
        onClose={() => {
          setShowSave(false);
          setName('');
        }}
        title="Filter opslaan"
        maxWidth="md"
        footer={
          <>
            <button type="button" onClick={handleSave} className="btn-primary flex-1">
              Opslaan
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSave(false);
                setName('');
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naam (bijv. Q1 2026)"
          className="input-field w-full"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      </Modal>
    </div>
  );
}
