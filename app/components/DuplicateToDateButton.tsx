'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Copy } from 'lucide-react';
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
  const isReplan =
    !!detention.isDoublePeriod && !!detention.nablijvenGeweigerd && !detention.followUpClosed;
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
      alert(
        isReplan
          ? `De weigering van ${studentName} blijft staan. Nieuwe strafstudie ingepland op ${targetLabel}.${result.extra}`
          : `${studentName} gekopieerd naar ${targetLabel}.${result.extra}`
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
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          isReplan
            ? 'btn-secondary text-xs px-2.5 py-1.5 shrink-0'
            : 'detention-card__action'
        }
        title={isReplan ? 'Nieuwe strafstudie inplannen' : 'Dupliceren naar andere datum'}
        disabled={disabled}
      >
        {isReplan ? (
          <>
            <CalendarPlus className="h-4 w-4 inline-block mr-1 -mt-0.5" />
            Nieuwe strafstudie
          </>
        ) : (
          <Copy className="h-5 w-5" />
        )}
      </button>

      <Modal
        open={open}
        onClose={close}
        title={isReplan ? 'Nieuwe strafstudie inplannen' : 'Nablijven dupliceren'}
        description={
          isReplan
            ? `De weigering van ${studentName} blijft op deze dag staan. Kies de nieuwe maandag.`
            : `Kopieer ${studentName} naar een andere datum.`
        }
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
              {busy ? 'Bezig…' : isReplan ? 'Inplannen' : 'Dupliceren'}
            </button>
          </>
        }
      >
        <label className="form-label" htmlFor={fieldId}>
          {isReplan ? 'Nieuwe maandag' : 'Nieuwe datum (maandag, dinsdag of donderdag)'}
        </label>
        <DateField
          id={fieldId}
          nablijvenOnly
          value={targetDate}
          onChange={setTargetDate}
          className="input-field date-field w-full"
        />
      </Modal>
    </>
  );
}
