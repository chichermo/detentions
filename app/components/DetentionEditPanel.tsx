'use client';

import type { ReactNode } from 'react';
import { Save, X } from 'lucide-react';
import { Detention, Student } from '@/types';

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="detention-field-label">{children}</span>;
}

interface DetentionEditPanelProps {
  detention: Partial<Detention>;
  students: Student[];
  onChange: (field: keyof Detention, value: unknown) => void;
  isMonday?: boolean;
  number?: number;
  onSave: () => void;
  onCancel: () => void;
}

export default function DetentionEditPanel({
  detention,
  students,
  onChange,
  isMonday,
  number,
  onSave,
  onCancel,
}: DetentionEditPanelProps) {
  const studentValue =
    detention.student?.includes(' - ')
      ? detention.student.split(' - ')[0]
      : detention.student || '';

  return (
    <div className="detention-edit-card">
      <div className="detention-edit-card__header">
        <span className="detention-edit-card__badge">{number}</span>
        <h3 className="detention-edit-card__title">Nablijven bewerken</h3>
        <div className="detention-edit-card__header-actions">
          <button
            type="button"
            onClick={onSave}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Opslaan
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Annuleren
          </button>
        </div>
      </div>

      <div className="detention-edit-card__grid">
        <div className="detention-edit-card__field detention-edit-card__field--full">
          <FieldLabel>Leerling</FieldLabel>
          <select
            value={studentValue}
            onChange={(e) => onChange('student', e.target.value)}
            className="select-field w-full"
          >
            <option value="">Selecteer leerling...</option>
            {students.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} - {s.grade}
              </option>
            ))}
          </select>
        </div>

        <div className="detention-edit-card__field">
          <FieldLabel>Leerkracht</FieldLabel>
          <input
            type="text"
            value={detention.teacher || ''}
            onChange={(e) => onChange('teacher', e.target.value)}
            className="input-field w-full"
            placeholder="Naam leerkracht"
          />
        </div>

        <div className="detention-edit-card__field">
          <FieldLabel>Reden</FieldLabel>
          <input
            type="text"
            value={detention.reason || ''}
            onChange={(e) => onChange('reason', e.target.value)}
            className="input-field w-full"
            placeholder="Reden"
          />
        </div>

        <div className="detention-edit-card__field">
          <FieldLabel>Opdracht</FieldLabel>
          <input
            type="text"
            value={detention.task || ''}
            onChange={(e) => onChange('task', e.target.value)}
            className="input-field w-full"
            placeholder="Taak"
          />
        </div>

        <div className="detention-edit-card__field">
          <FieldLabel>Datum LVS</FieldLabel>
          <input
            type="date"
            value={detention.lvsDate || ''}
            onChange={(e) => onChange('lvsDate', e.target.value)}
            className="input-field date-field w-full"
          />
        </div>

        <div className="detention-edit-card__checks">
          <label className="detention-edit-card__check">
            <input
              type="checkbox"
              checked={detention.shouldPrint || false}
              onChange={(e) => onChange('shouldPrint', e.target.checked)}
            />
            Afdrukken
          </label>
          <label className="detention-edit-card__check">
            <input
              type="checkbox"
              checked={detention.canUseChromebook || false}
              onChange={(e) => onChange('canUseChromebook', e.target.checked)}
            />
            Chromebook
          </label>
          <label className="detention-edit-card__check detention-edit-card__check--danger">
            <input
              type="checkbox"
              checked={detention.nablijvenGeweigerd || false}
              onChange={(e) => onChange('nablijvenGeweigerd', e.target.checked)}
            />
            Geweigerd
          </label>
          {isMonday && (
            <label className="detention-edit-card__check">
              <input
                type="checkbox"
                checked={detention.isDoublePeriod || false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onChange('isDoublePeriod', checked);
                  if (!checked) onChange('timePeriod', undefined);
                }}
              />
              Strafstudie
            </label>
          )}
        </div>

        <div className="detention-edit-card__field detention-edit-card__field--full">
          <FieldLabel>Opmerkingen</FieldLabel>
          <textarea
            value={detention.extraNotes || ''}
            onChange={(e) => onChange('extraNotes', e.target.value)}
            className="detention-notes-input"
            placeholder="Extra opmerkingen..."
            rows={4}
          />
        </div>
      </div>

      <div className="detention-edit-card__footer sm:hidden">
        <button
          type="button"
          onClick={onSave}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          Opslaan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4" />
          Annuleren
        </button>
      </div>
    </div>
  );
}
