'use client';

import { useState, useEffect } from 'react';
import { History, User, Clock, FileText, Trash2, Edit, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import nl from 'date-fns/locale/nl';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_by: string | null;
  changed_at: string;
}

interface AuditHistoryProps {
  tableName: 'students' | 'detentions';
  recordId: string;
}

export default function AuditHistory({ tableName, recordId }: AuditHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [tableName, recordId]);

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`/api/audit?table=${tableName}&recordId=${recordId}`);
      const data = await response.json();
      setLogs(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-emerald-400" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-400" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'UPDATE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'DELETE':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  const getChangedFields = (oldData: any, newData: any) => {
    if (!oldData || !newData) return [];
    const changed: string[] = [];
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changed.push(key);
      }
    });
    return changed;
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="text-center text-slate-400">Laden...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-100">Geschiedenis</h3>
        </div>
        <p className="text-slate-400 text-sm">Geen geschiedenis beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-slate-100">Geschiedenis van Wijzigingen</h3>
      </div>

      <div className="space-y-4">
        {logs.map((log) => {
          const changedFields = log.action === 'UPDATE' 
            ? getChangedFields(log.old_data, log.new_data)
            : [];

          return (
            <div
              key={log.id}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getActionIcon(log.action)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-slate-400">
                        {format(parseISO(log.changed_at), 'dd MMM yyyy, HH:mm', { locale: nl })}
                      </span>
                    </div>
                    {log.changed_by && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <User className="h-3 w-3" />
                        <span>{log.changed_by}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  {expandedLog === log.id ? 'Verberg' : 'Details'}
                </button>
              </div>

              {log.action === 'UPDATE' && changedFields.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-slate-400 mb-1">Gewijzigde velden:</p>
                  <div className="flex flex-wrap gap-1">
                    {changedFields.map((field) => (
                      <span
                        key={field}
                        className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {expandedLog === log.id && (
                <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                  {log.old_data && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">Oude Data:</p>
                      <pre className="bg-slate-800/50 p-3 rounded text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(log.old_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.new_data && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">Nieuwe Data:</p>
                      <pre className="bg-slate-800/50 p-3 rounded text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(log.new_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
