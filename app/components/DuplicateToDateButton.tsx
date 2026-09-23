'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import nl from 'date-fns/locale/nl';
import { Detention } from '@/types';
import Modal from '@/app/components/ui/Modal';
import DateField from '@/app/components/DateField';
import {
  copyDetentionsToDate,
  copyDetentionsErrorMessage,
} from '@/lib/copyDetentionsToDate';
import { getDetentionStudentName } from '@/lib/detentionValidation';

type Props = {
  detention: Detention;
  disabled?: boolean;
};

export default function DuplicateToDateButton({ detention, disabled }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [busy, setBusy] = useState(false);

  const studentName = getDetentionStudentName(detention.student);
  const fieldId = `duplicate-to-date-${detention.id}`;

  const close = () => {
    if (busy) return;
    setOpen(false);
    setTargetDate('');
  };

  const handleDuplicate = async () => {
    if (busy || !targetDate) return;
    setBusy(true);
    try {
      const result = await copyDetentionsToDate([detention], detention.date, targetDate);
      const targetLabel = format(parseISO(result.targetDate), 'EEEE d MMMM yyyy', { locale: nl });
      alert(`${studentName} gekopieerd naar ${targetLabel}.${result.extra}`);
      setOpen(false);
      setTargetDate('');
      router.push(`/detentions/${result.targetDate}`);
    } catch (error) {
      alert(copyDetentionsErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="detention-card__action"
        title="Dupliceren naar andere datum"
        disabled={disabled}
      >
        <Copy className="h-5 w-5" />
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Nablijven dupliceren"
        description={`Kopieer ${studentName} naar een andere datum.`}
        footer={
          <>
            <button type="button" className="btn-secondary flex-1" onClick={close} disabled={busy}>
              Annuleren
            </button>
            <button
              type="button"
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDuplicate}
              disabled={!targetDate || busy}
            >
              {busy ? 'Bezig…' : 'Dupliceren'}
            </button>
          </>
        }
      >
        <label className="form-label" htmlFor={fieldId}>
          Nieuwe datum (maandag, dinsdag of donderdag)
        </label>
        <DateField
          id={fieldId}
          value={targetDate}
          onChange={setTargetDate}
          className="input-field date-field w-full"
        />
      </Modal>
    </>
  );
}
