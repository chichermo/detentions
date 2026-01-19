'use client';

import { useState } from 'react';
import { Copy, Calendar } from 'lucide-react';
import { Detention } from '@/types';

interface DuplicateSessionProps {
  detentions: Detention[];
  currentDate: string;
  onDuplicate: (newDate: string, duplicatedDetentions: Detention[]) => void;
}

export default function DuplicateSession({ detentions, currentDate, onDuplicate }: DuplicateSessionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [newDate, setNewDate] = useState('');

  const handleDuplicate = () => {
    if (!newDate) return;
    
    const duplicated = detentions.map((detention, index) => ({
      ...detention,
      id: `detention-${Date.now()}-${index}`,
      date: newDate,
      number: index + 1,
    }));

    onDuplicate(newDate, duplicated);
    setShowDialog(false);
    setNewDate('');
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="btn-secondary flex items-center gap-2"
      >
        <Copy className="h-5 w-5" />
        Dupliceer Sessie
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Copy className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Sessie Dupliceren</h3>
            </div>

            <p className="text-slate-300 mb-4">
              Deze sessie heeft <strong>{detentions.length}</strong> nablijven. 
              Selecteer een nieuwe datum om de sessie te dupliceren.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nieuwe Datum
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDuplicate}
                disabled={!newDate}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dupliceer
              </button>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setNewDate('');
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
