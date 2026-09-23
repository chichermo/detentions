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

type Variant = 'card' | 'header';

type Props = {
  detentions: Detention[];
  sourceDate: string;
  variant?: Variant;
  disabled?: boolean;
};

export default function DuplicateToDateButton({
  detentions,
  sourceDate,
  variant = 'card',
  disabled,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [busy, setBusy] = useState(false);

  if (detentions.length === 0) return null;

  const isSingle = detentions.length === 1;
  const studentName = isSingle ? getDetentionStudentName(detentions[0].student) : '';
  const title = isSingle ? 'Nablijven dupliceren' : 'Sessie dupliceren';
  const description = isSingle
    ? `Kopieer ${studentName} naar een andere datum.`
    : `Kopieer deze ${detentions.length} nablijven naar een andere datum.`;

  const close = () => {
    if (busy) return;
    setOpen(false);
    setTargetDate('');
  };

  const handleDuplicate = async () => {
    if (busy || !targetDate) return;
    setBusy(true);
    try {
      const result = await copyDetentionsToDate(detentions, sourceDate, targetDate);
      const targetLabel = format(parseISO(result.targetDate), 'EEEE d MMMM yyyy', { locale: nl });
      alert(
        isSingle
          ? `${studentName} gekopieerd naar ${targetLabel}.${result.extra}`
          : `${result.count} nablijven gekopieerd naar ${targetLabel}.${result.extra}`
      );
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
      {variant === 'card' ? (
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
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
          title="Kopieer deze sessie naar een andere datum"
          disabled={disabled}
        >
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">Sessie dupliceren</span>
          <span className="sm:hidden">Dupliceren</span>
        </button>
      )}

      <Modal
        open={open}
        onClose={close}
        title={title}
        description={description}
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
        <label className="form-label" htmlFor={`duplicate-to-date-${sourceDate}-${detentions[0]?.id || 'session'}`}>
          Nieuwe datum (maandag, dinsdag of donderdag)
        </label>
        <DateField
          id={`duplicate-to-date-${sourceDate}-${detentions[0]?.id || 'session'}`}
          value={targetDate}
          onChange={setTargetDate}
          className="input-field date-field w-full"
        />
      </Modal>
    </>
  );
}
