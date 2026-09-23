'use client';

import { useMemo } from 'react';
import { Detention } from '@/types';
import {
  buildDetailedReports,
  flattenFollowUpDisplayRows,
  FollowUpReportRow,
  StudentReportRow,
} from '@/lib/detentionReports';
import { format, parseISO } from 'date-fns';
import nl from 'date-fns/locale/nl';
import { normalizeDetentionDate } from '@/lib/detentionValidation';

interface Props {
  detentions: Detention[];
  /** Alleen de twee rode opvolgingskaders (Statistieken, bovenaan). */
  followUpOnly?: boolean;
  /** Rapporttabellen zonder de twee opvolgingskaders. */
  hideFollowUp?: boolean;
}

function formatDay(date: string): string {
  const day = normalizeDetentionDate(date);
  try {
    return format(parseISO(day || date), 'd MMM yyyy', { locale: nl });
  } catch {
    return day || date;
  }
}

function ReportTable({
  title,
  description,
  rows,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: StudentReportRow[];
  emptyMessage: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
      </div>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      {rows.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-simple w-full">
            <thead>
              <tr>
                <th>Leerling</th>
                <th className="text-right">Aantal</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.student}>
                  <td className="font-medium">{row.student}</td>
                  <td className="text-right">{row.count}</td>
                  <td className="text-sm text-slate-400">
                    {row.detentions.map((d) => (
                      <span key={d.id} className="block">
                        {formatDay(d.date)}
                        {d.nablijvenGeweigerd && ' · geweigerd'}
                        {d.isDoublePeriod && ' · strafstudie'}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FollowUpTable({
  title,
  emptyMessage,
  rows,
  frameClass = 'card-follow-up',
}: {
  title: string;
  emptyMessage: string;
  rows: FollowUpReportRow[];
  frameClass?: string;
}) {
  const openCount = rows.filter((row) => row.hasOpenFollowUp).length;
  const displayRows = useMemo(() => flattenFollowUpDisplayRows(rows), [rows]);

  return (
    <div className={`card ${frameClass} p-6`}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        {openCount > 0 && (
          <span className="badge-danger">{openCount} open</span>
        )}
      </div>
      {displayRows.length === 0 ? (
        <p className="text-slate-300/70 text-sm py-4">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-simple w-full">
            <thead>
              <tr>
                <th>Leerling</th>
                <th>Geweigerd op</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr key={row.key}>
                  <td className="font-medium">{row.student}</td>
                  <td>
                    {row.sources.map((d) => formatDay(d.date)).join(', ')}
                    {' · geweigerd'}
                  </td>
                  <td className="text-sm">
                    {row.linked ? (
                      <span className="text-slate-100">
                        Strafstudie {formatDay(row.linked.date)}
                      </span>
                    ) : (
                      <span className="text-red-100 font-medium">Nog in te plannen</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DetailedReportsSection({ detentions, followUpOnly, hideFollowUp }: Props) {
  const reports = useMemo(() => buildDetailedReports(detentions), [detentions]);

  const followUpTables = (
    <>
      <FollowUpTable
        title="Opvolging weigeringen"
        emptyMessage="Geen geweigerde nablijven in deze periode."
        rows={reports.followUp}
        frameClass="card-follow-up"
      />
      <FollowUpTable
        title="Strafstudie weigeren"
        emptyMessage="Geen geweigerde strafstudies in deze periode."
        rows={reports.strafstudieFollowUp}
        frameClass="card-follow-up-strafstudie"
      />
    </>
  );

  if (followUpOnly) {
    return (
      <section className="mb-8 space-y-6">
        <div className="grid grid-cols-1 gap-6">{followUpTables}</div>
      </section>
    );
  }

  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="section-title">Gedetailleerde leerlingrapporten</h2>
        <p className="text-slate-400 text-sm mt-1">
          Strafstudie geldt alleen op maandag, na weigering van gewone nablijven (ma/di/do).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!hideFollowUp && followUpTables}
        <ReportTable
          title="Leerlingen met nablijven"
          description="Alle leerlingen met minstens één registratie in de geselecteerde periode."
          rows={reports.withDetentions}
          emptyMessage="Geen leerlingen met nablijven in deze periode."
        />
        <ReportTable
          title="Leerlingen met strafstudie (maandag)"
          description="Strafstudie op maandag (16:00–17:40)."
          rows={reports.withDoubleDetentions}
          emptyMessage="Geen strafstudies geregistreerd."
        />
      </div>
    </section>
  );
}
