'use client';

import { GripVertical, Edit, Trash2, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import DragDropDetentions from '@/app/components/DragDropDetentions';
import DetentionEditPanel from '@/app/components/DetentionEditPanel';
import { Detention, Student } from '@/types';

interface DetentionSessionListProps {
  detentions: Detention[];
  students: Student[];
  isMonday: boolean;
  editingId: string | null;
  editingDetention: Partial<Detention> | null;
  onReorder: (reordered: Detention[]) => void;
  onEdit: (detention: Detention) => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (field: keyof Detention, value: unknown) => void;
  onDelete: (id: string) => void;
  onShowHistory: (id: string) => void;
}

function Flag({ on, label }: { on: boolean; label: string }) {
  if (!on) return null;
  return (
    <span className="detention-flag" title={label}>
      {label}
    </span>
  );
}

export default function DetentionSessionList({
  detentions,
  students,
  isMonday,
  editingId,
  editingDetention,
  onReorder,
  onEdit,
  onSave,
  onCancel,
  onChange,
  onDelete,
  onShowHistory,
}: DetentionSessionListProps) {
  const dragDisabled = editingId !== null;

  return (
    <div className="detention-list" role="list">
      <DragDropDetentions
        detentions={detentions}
        onReorder={onReorder}
        dragDisabled={dragDisabled}
      >
        {(detention, _index, isDragging) => {
          const isEditing = editingId === detention.id && editingDetention;

          return (
            <article
              className={`detention-card ${isDragging ? 'detention-card--dragging' : ''} ${
                isEditing ? 'detention-card--editing' : ''
              }`}
              role="listitem"
            >
              {isEditing ? (
                <DetentionEditPanel
                  detention={editingDetention}
                  students={students}
                  onChange={onChange}
                  isMonday={isMonday}
                  number={detention.number}
                  onSave={onSave}
                  onCancel={onCancel}
                />
              ) : (
                <>
                  <div className="detention-card__top">
                    <div
                      className={`detention-card__grip ${dragDisabled ? 'opacity-30' : ''}`}
                      title={dragDisabled ? undefined : 'Verslepen om volgorde te wijzigen'}
                    >
                      <GripVertical className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="detention-card__number">{detention.number}</span>
                    <div className="detention-card__title min-w-0">
                      <p className="detention-card__student truncate" title={detention.student}>
                        {detention.student}
                      </p>
                      <div className="detention-card__flags">
                        <Flag on={!!detention.shouldPrint} label="Afdrukken" />
                        <Flag on={!!detention.canUseChromebook} label="Chromebook" />
                        <Flag on={!!detention.nablijvenGeweigerd} label="Geweigerd" />
                        <Flag on={!!detention.didNotAttend} label="Niet opgedagen" />
                        {isMonday && detention.isDoublePeriod && (
                          <span className="detention-flag detention-flag--amber">Dubbel</span>
                        )}
                      </div>
                    </div>
                    <div className="detention-card__actions">
                      <button
                        type="button"
                        onClick={() => onShowHistory(detention.id)}
                        className="detention-card__action"
                        title="Geschiedenis"
                      >
                        <History className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(detention)}
                        className="detention-card__action detention-card__action--primary"
                        title="Bewerken"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(detention.id)}
                        className="detention-card__action detention-card__action--danger"
                        title="Verwijderen"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <dl className="detention-card__meta">
                    <div>
                      <dt>Leerkracht</dt>
                      <dd>{detention.teacher || '—'}</dd>
                    </div>
                    <div>
                      <dt>Reden</dt>
                      <dd>{detention.reason || '—'}</dd>
                    </div>
                    <div>
                      <dt>Opdracht</dt>
                      <dd>{detention.task || '—'}</dd>
                    </div>
                    <div>
                      <dt>Datum LVS</dt>
                      <dd>
                        {detention.lvsDate
                          ? format(parseISO(detention.lvsDate), 'dd/MM/yyyy')
                          : '—'}
                      </dd>
                    </div>
                  </dl>

                  {detention.extraNotes && (
                    <p className="detention-card__notes">
                      <span className="font-semibold text-muted">Opmerkingen: </span>
                      {detention.extraNotes}
                    </p>
                  )}
                </>
              )}
            </article>
          );
        }}
      </DragDropDetentions>
    </div>
  );
}
