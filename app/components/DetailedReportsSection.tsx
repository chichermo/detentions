'use client';

import { useMemo } from 'react';
import { Detention } from '@/types';
import {
  buildDetailedReports,
  FollowUpReportRow,
  StudentReportRow,
} from '@/lib/detentionReports';
import { format, parseISO } from 'date-fns';
import nl from 'date-fns/locale/nl';

interface Props {
  detentions: Detention[];
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
                        {format(parseISO(d.date), 'd MMM yyyy', { locale: nl })}
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

function FollowUpTable({ rows }: { rows: FollowUpReportRow[] }) {
  const openCount = rows.filter((row) => row.hasOpenFollowUp).length;

  return (
    <div className="card card-follow-up p-6">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h3 className="text-lg font-bold text-slate-100">Opvolging weigeringen</h3>
        {openCount > 0 && (
          <span className="badge-warning">{openCount} open</span>
        )}
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Geweigerde nablijven (ma/di/do). Blijft open tot er een strafstudie is met melding
        “weigeren nablijven” (mag iets afwijken), ook als die tot twee weken later valt.
      </p>
      {rows.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">Geen geweigerde nablijven in deze periode.</p>
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
              {rows.map((row) =>
                row.detentions.map((d) => {
                  const linked = row.linkedBySourceId[d.id];
                  return (
                    <tr key={d.id}>
                      <td className="font-medium">{row.student}</td>
                      <td>
                        {format(parseISO(d.date), 'd MMM yyyy', { locale: nl })}
                        {' · geweigerd'}
                      </td>
                      <td className="text-sm">
                        {linked ? (
                          <span className="text-slate-300">
                            Strafstudie {format(parseISO(linked.date), 'd MMM yyyy', { locale: nl })}
                          </span>
                        ) : (
                          <span className="text-amber-200 font-medium">Nog in te plannen</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DetailedReportsSection({ detentions }: Props) {
  const reports = useMemo(() => buildDetailedReports(detentions), [detentions]);

  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="section-title">Gedetailleerde leerlingrapporten</h2>
        <p className="text-slate-400 text-sm mt-1">
          Strafstudie geldt alleen op maandag, na weigering van gewone nablijven (ma/di/do).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FollowUpTable rows={reports.followUp} />
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
        <ReportTable
          title="Strafstudie: geweigerd"
          description="Maandag-strafstudie waar de leerling opnieuw weigerde."
          rows={reports.doubleMissedOrRejected}
          emptyMessage="Geen geweigerde strafstudies."
        />
      </div>
    </section>
  );
}
