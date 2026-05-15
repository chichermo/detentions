'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Detention } from '@/types';
import Modal from '@/app/components/ui/Modal';

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
        type="button"
        onClick={() => setShowDialog(true)}
        className="btn-secondary flex items-center gap-2 text-sm"
      >
        <Copy className="h-5 w-5" />
        Dupliceer sessie
      </button>

      <Modal
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          setNewDate('');
        }}
        title="Sessie dupliceren"
        description={`Kopieer ${detentions.length} nablijven van ${currentDate} naar een nieuwe datum.`}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowDialog(false);
                setNewDate('');
              }}
              className="btn-secondary flex-1"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={!newDate}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dupliceren
            </button>
          </>
        }
      >
        <label className="form-label" htmlFor="duplicate-date">
          Nieuwe datum
        </label>
        <input
          id="duplicate-date"
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="input-field date-field w-full"
          min={new Date().toISOString().split('T')[0]}
        />
      </Modal>
    </>
  );
}
