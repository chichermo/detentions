/**
 * Utilidades para guardar y cargar filtros guardados
 */

export interface SavedFilter {
  id: string;
  name: string;
  filters: any;
  createdAt: string;
}

const STORAGE_KEY = 'nablijven_saved_filters';

export function saveFilter(name: string, filters: any): string {
  const savedFilters = getSavedFilters();
  const newFilter: SavedFilter = {
    id: `filter-${Date.now()}`,
    name,
    filters,
    createdAt: new Date().toISOString(),
  };
  savedFilters.push(newFilter);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFilters));
  return newFilter.id;
}

export function getSavedFilters(): SavedFilter[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function loadFilter(id: string): SavedFilter | null {
  const filters = getSavedFilters();
  return filters.find(f => f.id === id) || null;
}

export function deleteFilter(id: string): void {
  const filters = getSavedFilters();
  const filtered = filters.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function updateFilter(id: string, name: string, filters: any): void {
  const savedFilters = getSavedFilters();
  const index = savedFilters.findIndex(f => f.id === id);
  if (index !== -1) {
    savedFilters[index] = {
      ...savedFilters[index],
      name,
      filters,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFilters));
  }
}
