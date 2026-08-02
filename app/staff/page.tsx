'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, UserCog, Upload, X } from 'lucide-react';
import { StaffMember } from '@/types';
import { apiFetch } from '@/lib/apiClient';
import MassImport from '@/app/components/MassImport';
import { parseBulkStaffLines } from '@/lib/staffImport';

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<StaffMember[] | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await apiFetch('/api/staff');
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filtered = staff
    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, 'nl');
    });

  const handleAddOne = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Vul een naam in.');
      return;
    }
    setSaving(true);
    try {
      const base = staff.reduce((max, s) => Math.max(max, s.sortOrder ?? -1), -1) + 1;
      const res = await apiFetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `staff-${Date.now()}`,
          name: trimmed,
          sortOrder: base,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details || data.error || 'Opslaan mislukt');
      setName('');
      setShowForm(false);
      await fetchStaff();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, memberName: string) => {
    if (!confirm(`"${memberName}" verwijderen uit personeel?`)) return;
    try {
      await apiFetch(`/api/staff?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await fetchStaff();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Verwijderen mislukt');
    }
  };

  const handleBulkPreview = () => {
    const names = parseBulkStaffLines(bulkText);
    if (!names.length) {
      alert('Plak minstens één naam (één per regel, of Achternaam;Voornaam).');
      setBulkPreview(null);
      return;
    }
    const existing = new Set(staff.map((s) => s.name.toLowerCase()));
    const base = staff.reduce((max, s) => Math.max(max, s.sortOrder ?? -1), -1) + 1;
    const stamp = Date.now();
    setBulkPreview(
      names
        .filter((n) => !existing.has(n.toLowerCase()))
        .map((n, index) => ({
          id: `staff-${stamp}-${index}`,
          name: n,
          sortOrder: base + index,
        }))
    );
  };

  const handleBulkSave = async () => {
    const payload = bulkPreview;
    if (!payload?.length) {
      handleBulkPreview();
      return;
    }
    setBulkSaving(true);
    try {
      const res = await apiFetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details || data.error || 'Bulk opslaan mislukt');
      if (data.failed && !data.saved) {
        throw new Error(data.firstError || data.details || 'Geen personeelsleden opgeslagen');
      }
      setBulkText('');
      setBulkPreview(null);
      setShowBulk(false);
      await fetchStaff();
      alert(`${data.saved ?? payload.length} personeelsleden toegevoegd`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Bulk opslaan mislukt');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleExcelImport = async (members: StaffMember[]) => {
    if (!members.length) return;
    const existing = new Set(staff.map((s) => s.name.toLowerCase()));
    const base = staff.reduce((max, s) => Math.max(max, s.sortOrder ?? -1), -1) + 1;
    const toSave = members
      .filter((m) => m.name && !existing.has(m.name.toLowerCase()))
      .map((m, i) => ({ ...m, sortOrder: base + i }));
    if (!toSave.length) {
      alert('Geen nieuwe namen (alles stond al in de lijst).');
      return;
    }
    const res = await apiFetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff: toSave }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.details || data.error || 'Import mislukt');
    if (data.failed && !data.saved) {
      throw new Error(data.firstError || data.details || 'Geen personeelsleden opgeslagen');
    }
    await fetchStaff();
    setShowImport(false);
    alert(`${data.saved ?? toSave.length} personeelsleden geïmporteerd`);
  };

  return (
    <div className="min-h-screen pb-12">
      <header className="glass sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => router.push('/')} className="btn-ghost p-2 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#e8953a] to-[#c97a28] text-[#1a1208]">
              <UserCog className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight truncate">
                Personeel
              </h1>
              <p className="text-slate-400 text-sm">{staff.length} leden in de lijst</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Lid toevoegen
            </button>
            <button type="button" onClick={() => setShowBulk(true)} className="btn-secondary inline-flex items-center gap-2">
              Bulk plakken
            </button>
            <button type="button" onClick={() => setShowImport(true)} className="btn-secondary inline-flex items-center gap-2">
              <Upload className="h-4 w-4" /> Excel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {showForm && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-100">Nieuw personeelslid</h2>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="block text-sm text-slate-300 mb-2">Naam</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="input-field flex-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Voornaam Achternaam"
                onKeyDown={(e) => e.key === 'Enter' && handleAddOne()}
              />
              <button type="button" disabled={saving} onClick={handleAddOne} className="btn-primary">
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          </div>
        )}

        {showBulk && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-100">Bulk import (plakken)</h2>
              <button type="button" onClick={() => { setShowBulk(false); setBulkPreview(null); }} className="btn-ghost p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-2">
              Eén naam per regel. Ook: <code className="text-slate-300">Achternaam;Voornaam</code>
            </p>
            <textarea
              className="input-field min-h-[140px] font-mono text-sm"
              value={bulkText}
              onChange={(e) => { setBulkText(e.target.value); setBulkPreview(null); }}
              placeholder={'Janssens;Lisa\nKoen Deleu\nManon Peeters'}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <button type="button" onClick={handleBulkPreview} className="btn-secondary">
                Preview
              </button>
              <button
                type="button"
                disabled={bulkSaving || !bulkPreview?.length}
                onClick={handleBulkSave}
                className="btn-primary disabled:opacity-50"
              >
                {bulkSaving ? 'Opslaan…' : `Bevestigen (${bulkPreview?.length || 0})`}
              </button>
            </div>
            {bulkPreview && (
              <div className="mt-4 max-h-48 overflow-y-auto border border-slate-700 rounded-lg">
                <table className="table-simple w-full text-sm">
                  <thead>
                    <tr><th>#</th><th>Naam</th></tr>
                  </thead>
                  <tbody>
                    {bulkPreview.map((m, i) => (
                      <tr key={m.id}><td>{i + 1}</td><td>{m.name}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showImport && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-100">Excel / CSV import</h2>
              <button type="button" onClick={() => setShowImport(false)} className="btn-ghost p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Upload een Excel/CSV met twee kolommen: <strong>Voornaam</strong> en{' '}
              <strong>Naam</strong> (achternaam). Optioneel ook Achternaam i.p.v. Naam.
            </p>
            <MassImport
              type="staff"
              onImportStaff={async (members) => {
                await handleExcelImport(members);
              }}
            />
          </div>
        )}

        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="font-bold text-slate-100 flex-1">Huidige lijst</h2>
            <input
              className="input-field input-field-with-icon max-w-xs"
              style={{ paddingLeft: '1rem' }}
              placeholder="Zoeken…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-slate-400 py-6 text-center">
              Nog geen personeel. Voeg een lid toe of importeer een lijst.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-simple w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Naam</th>
                    <th className="text-right">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id}>
                      <td className="text-slate-500">{i + 1}</td>
                      <td className="font-medium">{m.name}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id, m.name)}
                          className="btn-ghost p-2 text-red-300 hover:text-red-200"
                          title="Verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
