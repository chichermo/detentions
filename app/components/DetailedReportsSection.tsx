'use client';

import { useMemo } from 'react';
import { Detention } from '@/types';
import { buildDetailedReports, StudentReportRow } from '@/lib/detentionReports';
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
      <h3 className="text-lg font-bold text-slate-100 mb-1">{title}</h3>
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
                        {d.didNotAttend && ' · niet opgedagen'}
                        {d.isDoublePeriod && ' · dubbele/strafstudie'}
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

export default function DetailedReportsSection({ detentions }: Props) {
  const reports = useMemo(() => buildDetailedReports(detentions), [detentions]);

  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="section-title">Gedetailleerde leerlingrapporten</h2>
        <p className="text-slate-400 text-sm mt-1">
          Dubbele nablijven gelden alleen op maandag (strafstudie), na weigering of niet opdagen op dinsdag/donderdag.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ReportTable
          title="Leerlingen met nablijven"
          description="Alle leerlingen met minstens één registratie in de geselecteerde periode."
          rows={reports.withDetentions}
          emptyMessage="Geen leerlingen met nablijven in deze periode."
        />
        <ReportTable
          title="Leerlingen met dubbele nablijven (maandag)"
          description="Strafstudie / dubbele periode op maandag."
          rows={reports.withDoubleDetentions}
          emptyMessage="Geen dubbele nablijven geregistreerd."
        />
        <ReportTable
          title="Niet opgedagen (zonder weigering)"
          description="Leerlingen die niet zijn komen opdagen zonder nablijven te weigeren."
          rows={reports.didNotAttendNotRejected}
          emptyMessage="Geen registraties van niet opdagen zonder weigering."
        />
        <ReportTable
          title="Dubbele nablijven: niet opgedagen of geweigerd"
          description="Maandag-strafstudie waar de leerling opnieuw niet kwam of weigerde."
          rows={reports.doubleMissedOrRejected}
          emptyMessage="Geen problemen bij dubbele nablijven."
        />
        <ReportTable
          title="Openstaande dubbele nablijven"
          description="Weigering of niet opdagen op di/do zonder gekoppelde maandag-registratie."
          rows={reports.pendingDouble}
          emptyMessage="Geen openstaande dubbele nablijven."
        />
      </div>
    </section>
  );
}
