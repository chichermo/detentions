'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText, Plus, Save, X, Copy, Printer } from 'lucide-react';
import DetentionTemplateManager from '@/app/components/DetentionTemplate';
import DetentionSessionList from '@/app/components/DetentionSessionList';
import AuditHistory from '@/app/components/AuditHistory';
import FileAttachment from '@/app/components/FileAttachment';
import StaffNameInput, { fetchStaffNames } from '@/app/components/StaffNameInput';
import DateField from '@/app/components/DateField';
import { Detention, Student, DayOfWeek } from '@/types';
import { apiFetch, OfflineQueuedError } from '@/lib/apiClient';
import { fetchCalendarDays, getDaySettingFromList } from '@/lib/calendarDaysClient';
import {
  validateRequiredDetentionFields,
  validateSessionCapacity,
  validateUniqueStudentOnDate,
  validateNoDuplicateStudentsInBatch,
  validateStrafstudieCoversRefusals,
  getDetentionStudentName,
  normalizeDetentionDate,
  MAX_DETECTIONS_PER_SESSION,
} from '@/lib/detentionValidation';
import { sortStudentsByClass } from '@/lib/studentImport';
import { format, parseISO } from 'date-fns';
import nl from 'date-fns/locale/nl';
import { getDayOfWeekFromDate, parseSessionDate } from '@/lib/calendarUtils';
import { canViewLogboek } from '@/lib/auth';

const DAYS: DayOfWeek[] = ['MAANDAG', 'DINSDAG', 'DONDERDAG'];

export default function DetentionSessionPage() {
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDetention, setEditingDetention] = useState<Partial<Detention> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDetention, setNewDetention] = useState<Partial<Detention> | null>(null);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [allowStrafstudie, setAllowStrafstudie] = useState(true);
  const [canViewHistory, setCanViewHistory] = useState(false);
  const [showDuplicateForm, setShowDuplicateForm] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState('');
  const [duplicateBusy, setDuplicateBusy] = useState(false);

  const fetchDetentions = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/detentions?date=${date}`);
      const data = await response.json();
      // Ordenar por número para asegurar que aparezcan en orden
      // Asegurar que todos los números sean válidos (>= 1)
      const validData = data.map((d: Detention) => ({
        ...d,
        number: d.number && d.number > 0 ? d.number : 1
      }));
      const sorted = validData.sort((a: Detention, b: Detention) => a.number - b.number);
      // Re-numerar si hay números duplicados o faltantes
      const renumbered = sorted.map((d: Detention, index: number) => ({
        ...d,
        number: index + 1
      }));
      setDetentions(renumbered);
    } catch (error) {
      console.error('Error fetching detentions:', error);
    }
  }, [date]);

  const fetchStudents = useCallback(async (day: DayOfWeek) => {
    try {
      const response = await apiFetch(`/api/students?day=${day}`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  useEffect(() => {
    setCanViewHistory(canViewLogboek());
  }, []);

  useEffect(() => {
    if (date) {
      fetchDetentions();
    }
  }, [date, fetchDetentions]);

  useEffect(() => {
    if (detentions.length > 0) {
      fetchStudents(detentions[0].dayOfWeek);
    } else if (date) {
      fetchStudents(getDayOfWeekFromDate(date));
    }
  }, [date, detentions, fetchStudents]);

  useEffect(() => {
    fetchStaffNames().then(setStaffNames);
  }, []);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    (async () => {
      try {
        const days = await fetchCalendarDays(date, date);
        const cfg = getDaySettingFromList(date, days);
        if (!cancelled) setAllowStrafstudie(cfg?.allowStrafstudie !== false);
      } catch {
        if (!cancelled) setAllowStrafstudie(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit nablijven wilt verwijderen?')) return;
    
    try {
      await apiFetch(`/api/detentions?id=${id}`, { method: 'DELETE' });
      fetchDetentions();
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        alert(error.message);
        return;
      }
      console.error('Error deleting detention:', error);
    }
  };

  const handleReorder = async (reorderedDetentions: Detention[]) => {
    try {
      // Update all detentions with new numbers
      for (const detention of reorderedDetentions) {
        await apiFetch('/api/detentions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detention),
        });
      }
      fetchDetentions();
    } catch (error) {
      console.error('Error reordering detentions:', error);
    }
  };

  const handleEdit = (detention: Detention) => {
    setEditingId(detention.id);
    // Extraer solo el nombre del estudiante (sin el grado)
    const studentName = detention.student.split(' - ')[0];
    setEditingDetention({
      ...detention,
      student: studentName,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingDetention || !editingId) return;

    const requiredErr = validateRequiredDetentionFields(editingDetention);
    if (requiredErr) {
      alert(requiredErr);
      return;
    }

    const parsed = parseSessionDate(String(editingDetention.date || date));
    if (!parsed) {
      alert('Kies een maandag, dinsdag of donderdag. Het nablijven kan alleen op die dagen.');
      return;
    }

    const dateChanged = parsed.date !== date;
    let targetDetentions = detentions;
    let allowStrafOnTarget = allowStrafstudie;

    try {
      const days = await fetchCalendarDays(parsed.date, parsed.date);
      const cfg = getDaySettingFromList(parsed.date, days);
      if (cfg?.blocked) {
        alert('Deze dag is geblokkeerd. Geen nablijven mogelijk.');
        return;
      }
      if (cfg && !cfg.allowDetentions) {
        alert('Voor deze dag zijn geen nablijven toegestaan volgens de kalender.');
        return;
      }
      allowStrafOnTarget = cfg?.allowStrafstudie !== false;
    } catch {
      /* offline: doorgaan */
    }

    if (dateChanged) {
      try {
        const res = await apiFetch(`/api/detentions?date=${encodeURIComponent(parsed.date)}`);
        const data = await res.json().catch(() => []);
        targetDetentions = Array.isArray(data) ? data : [];
      } catch (error) {
        if (error instanceof OfflineQueuedError) {
          alert(error.message);
          return;
        }
        alert('Kon de nieuwe dag niet controleren. Probeer het opnieuw.');
        return;
      }
      const capacityErr = validateSessionCapacity(targetDetentions.length, 1);
      if (capacityErr) {
        alert(capacityErr);
        return;
      }
    }

    const isTargetMonday = parsed.dayOfWeek === 'MAANDAG';
    let isDoublePeriod = !!editingDetention.isDoublePeriod && isTargetMonday;
    if (isTargetMonday && !allowStrafOnTarget && isDoublePeriod) {
      alert('Op deze maandag is geen strafstudie toegestaan. Alleen gewoon nablijven.');
      return;
    }

    const original = detentions.find((d) => d.id === editingId);
    const student = students.find((s) => s.name === editingDetention.student);
    const studentDisplayName = student
      ? `${student.name} - ${student.grade}`
      : original?.student || editingDetention.student || '';

    const updatedDetention: Detention = {
      ...editingDetention as Detention,
      id: editingId,
      student: studentDisplayName,
      date: parsed.date,
      dayOfWeek: parsed.dayOfWeek,
      isDoublePeriod,
      timePeriod: isDoublePeriod ? editingDetention.timePeriod : undefined,
      number: dateChanged
        ? targetDetentions.length + 1
        : editingDetention.number || original?.number || 1,
    };

    const dupErr = validateUniqueStudentOnDate(updatedDetention, targetDetentions, editingId);
    if (dupErr) {
      alert(dupErr);
      return;
    }

    try {
      const allRes = await apiFetch('/api/detentions', { cache: 'no-store' });
      const allDetentions = await allRes.json().catch(() => []);
      const mergeErr = validateStrafstudieCoversRefusals(
        updatedDetention,
        Array.isArray(allDetentions) ? allDetentions : [],
        editingId
      );
      if (mergeErr) {
        alert(mergeErr);
        return;
      }
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        alert(error.message);
        return;
      }
    }

    try {
      const response = await apiFetch('/api/detentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDetention),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data?.details || data?.error || 'Fout bij opslaan. Probeer het opnieuw.');
        return;
      }
      setEditingId(null);
      setEditingDetention(null);
      if (dateChanged) {
        router.push(`/detentions/${parsed.date}`);
      } else {
        fetchDetentions();
      }
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        alert(error.message);
        return;
      }
      console.error('Error saving detention:', error);
      alert('Fout bij opslaan. Controleer je verbinding en probeer het opnieuw.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingDetention(null);
  };

  const handleAddNew = () => {
    const capacityErr = validateSessionCapacity(detentions.length, 1);
    if (capacityErr) {
      alert(capacityErr);
      return;
    }
    const dayOfWeek = detentions.length > 0 ? detentions[0].dayOfWeek : getDayOfWeekFromDate(date);
    setNewDetention({
      number: detentions.length + 1,
      date,
      dayOfWeek,
      student: '',
      teacher: '',
      reason: '',
      task: '',
      lvsDate: '',
      shouldPrint: false,
      canUseChromebook: false,
      extraNotes: '',
      isDoublePeriod: false,
      timePeriod: undefined,
      nablijvenGeweigerd: false,
      didNotAttend: false,
    });
    setShowAddForm(true);
    fetchStudents(dayOfWeek);
  };

  const handleSaveNew = async () => {
    if (!newDetention) return;

    const requiredErr = validateRequiredDetentionFields(newDetention);
    if (requiredErr) {
      alert(requiredErr);
      return;
    }

    const capacityErr = validateSessionCapacity(detentions.length, 1);
    if (capacityErr) {
      alert(capacityErr);
      return;
    }

    if (
      (newDetention.dayOfWeek || getDayOfWeekFromDate(date)) === 'MAANDAG' &&
      !allowStrafstudie &&
      newDetention.isDoublePeriod
    ) {
      alert('Op deze maandag is geen strafstudie toegestaan. Alleen gewoon nablijven.');
      return;
    }

    const student = students.find(s => s.name === newDetention.student);
    const studentDisplayName = student 
      ? `${student.name} - ${student.grade}`
      : newDetention.student || '';

    const detentionToSave: Detention = {
      id: `detention-${Date.now()}`,
      number: newDetention.number || detentions.length + 1,
      date,
      dayOfWeek: newDetention.dayOfWeek || 'MAANDAG',
      student: studentDisplayName,
      teacher: newDetention.teacher || '',
      reason: newDetention.reason || '',
      task: newDetention.task || '',
      lvsDate: newDetention.lvsDate || '',
      shouldPrint: newDetention.shouldPrint || false,
      canUseChromebook: newDetention.canUseChromebook || false,
      extraNotes: newDetention.extraNotes || '',
      isDoublePeriod: newDetention.isDoublePeriod || false,
      timePeriod: newDetention.timePeriod,
      nablijvenGeweigerd: newDetention.nablijvenGeweigerd || false,
      didNotAttend: newDetention.didNotAttend || false,
    };

    const dupErr = validateUniqueStudentOnDate(detentionToSave, detentions);
    if (dupErr) {
      alert(dupErr);
      return;
    }

    try {
      const allRes = await apiFetch('/api/detentions', { cache: 'no-store' });
      const allDetentions = await allRes.json().catch(() => []);
      const mergeErr = validateStrafstudieCoversRefusals(
        detentionToSave,
        Array.isArray(allDetentions) ? allDetentions : []
      );
      if (mergeErr) {
        alert(mergeErr);
        return;
      }
    } catch {
      /* API-check bij opslaan blijft de echte poort */
    }

    try {
      const response = await apiFetch('/api/detentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detentionToSave),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data?.details || data?.error || 'Fout bij opslaan. Probeer het opnieuw.');
        return;
      }
      setShowAddForm(false);
      setNewDetention(null);
      fetchDetentions();
    } catch (error) {
      console.error('Error saving new detention:', error);
      alert('Fout bij opslaan. Controleer je verbinding en probeer het opnieuw.');
    }
  };

  const currentDayOfWeek = detentions.length > 0 ? detentions[0].dayOfWeek : getDayOfWeekFromDate(date);
  const hasDoublePeriod = detentions.some(d => d.isDoublePeriod);
  const isMonday = currentDayOfWeek === 'MAANDAG';

  const studentsForSession = useMemo(() => {
    const taken = new Set(
      detentions
        .filter((d) => d.id !== editingId)
        .map((d) => getDetentionStudentName(d.student).toLowerCase())
    );
    return students.filter((s) => !taken.has(s.name.trim().toLowerCase()));
  }, [students, detentions, editingId]);

  const handleDuplicateToDate = async () => {
    if (duplicateBusy) return;
    if (detentions.length === 0) {
      alert('Deze sessie heeft geen nablijven om te kopiëren.');
      return;
    }

    const parsed = parseSessionDate(duplicateDate);
    if (!parsed) {
      alert('Kies een maandag, dinsdag of donderdag. Het nablijven kan alleen op die dagen.');
      return;
    }
    if (parsed.date === normalizeDetentionDate(date)) {
      alert('Kies een andere datum dan de huidige sessie.');
      return;
    }

    setDuplicateBusy(true);
    try {
      let allowStrafOnTarget = true;
      try {
        const days = await fetchCalendarDays(parsed.date, parsed.date);
        const cfg = getDaySettingFromList(parsed.date, days);
        if (cfg?.blocked) {
          alert('Deze dag is geblokkeerd. Geen nablijven mogelijk.');
          return;
        }
        if (cfg && !cfg.allowDetentions) {
          alert('Voor deze dag zijn geen nablijven toegestaan volgens de kalender.');
          return;
        }
        allowStrafOnTarget = cfg?.allowStrafstudie !== false;
      } catch {
        /* offline: verder met clientvalidatie */
      }

      const existingRes = await apiFetch('/api/detentions', { cache: 'no-store' });
      const existingData = await existingRes.json().catch(() => []);
      const allExisting: Detention[] = Array.isArray(existingData) ? existingData : [];
      const existingOnTarget = allExisting.filter(
        (d) => normalizeDetentionDate(d.date) === parsed.date
      );

      const capacityErr = validateSessionCapacity(existingOnTarget.length, detentions.length);
      if (capacityErr) {
        alert(capacityErr);
        return;
      }
      const batchErr = validateNoDuplicateStudentsInBatch(detentions);
      if (batchErr) {
        alert(batchErr);
        return;
      }

      const isTargetMonday = parsed.dayOfWeek === 'MAANDAG';
      const stamp = Date.now();
      const planned: Detention[] = [];
      let strafstudieOmgezet = 0;

      for (let i = 0; i < detentions.length; i++) {
        const detention = detentions[i];
        let isDoublePeriod = !!detention.isDoublePeriod && isTargetMonday;
        if (detention.isDoublePeriod && (!isTargetMonday || !allowStrafOnTarget)) {
          isDoublePeriod = false;
          strafstudieOmgezet += 1;
        }

        const payload: Detention = {
          ...detention,
          id: `detention-${stamp}-${i}`,
          date: parsed.date,
          dayOfWeek: parsed.dayOfWeek,
          number: existingOnTarget.length + i + 1,
          isDoublePeriod,
          timePeriod: isDoublePeriod ? detention.timePeriod : undefined,
          sourceDetentionId: undefined,
        };

        const dupErr = validateUniqueStudentOnDate(payload, [...existingOnTarget, ...planned]);
        if (dupErr) {
          alert(dupErr);
          return;
        }
        const mergeErr = validateStrafstudieCoversRefusals(payload, [...allExisting, ...planned]);
        if (mergeErr) {
          alert(mergeErr);
          return;
        }
        planned.push(payload);
      }

      for (const payload of planned) {
        const response = await apiFetch('/api/detentions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          alert(data?.details || data?.error || 'Fout bij dupliceren. Probeer het opnieuw.');
          return;
        }
      }

      const targetLabel = format(parseISO(parsed.date), 'EEEE d MMMM yyyy', { locale: nl });
      const extra =
        strafstudieOmgezet > 0
          ? isTargetMonday
            ? ' Strafstudie is omgezet naar gewoon nablijven (niet toegestaan op deze maandag).'
            : ' Strafstudie is omgezet naar gewoon nablijven (alleen op maandag mogelijk).'
          : '';
      alert(`${planned.length} nablijven gekopieerd naar ${targetLabel}.${extra}`);
      setShowDuplicateForm(false);
      setDuplicateDate('');
      router.push(`/detentions/${parsed.date}`);
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        alert(error.message);
        return;
      }
      console.error('Error duplicating session:', error);
      alert('Fout bij dupliceren van de sessie. Controleer je verbinding en probeer het opnieuw.');
    } finally {
      setDuplicateBusy(false);
    }
  };

  return (
    <div className="app-page">
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/')}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
                  Nablijven Sessie
                </h1>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">
                  {format(parseISO(date), "EEEE d MMMM yyyy", { locale: nl })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
                title="Afdrukken"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Afdrukken</span>
              </button>
              {detentions.length > 0 && (
                showDuplicateForm ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 hidden sm:inline">Naar</span>
                    <DateField
                      id="duplicate-to-date"
                      value={duplicateDate}
                      onChange={setDuplicateDate}
                      className="input-field date-field w-[10.5rem]"
                    />
                    <button
                      type="button"
                      onClick={handleDuplicateToDate}
                      disabled={!duplicateDate || duplicateBusy}
                      className="btn-primary flex items-center gap-2 text-sm px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {duplicateBusy ? 'Bezig…' : 'Kopiëren'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDuplicateForm(false);
                        setDuplicateDate('');
                      }}
                      disabled={duplicateBusy}
                      className="btn-ghost p-2"
                      aria-label="Dupliceren annuleren"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDuplicateForm(true)}
                    className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
                    title="Kopieer deze sessie naar een andere datum"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">Dupliceren naar datum</span>
                    <span className="sm:hidden">Dupliceren</span>
                  </button>
                )
              )}
              {!showAddForm && (
                <button
                  onClick={handleAddNew}
                  disabled={detentions.length >= MAX_DETECTIONS_PER_SESSION}
                  className="btn-secondary flex items-center gap-2 text-sm px-3 sm:px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    detentions.length >= MAX_DETECTIONS_PER_SESSION
                      ? `Maximum ${MAX_DETECTIONS_PER_SESSION} leerlingen per sessie`
                      : undefined
                  }
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Nieuwe Toevoegen</span>
                  <span className="sm:hidden">Nieuw</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="card p-8 mb-8 print:shadow-none">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="section-title">
                Nablijven {hasDoublePeriod ? '(Strafstudie: 16u tot 17u40)' : '(van 16u tot 16u50)'}
              </h2>
              <p className="section-subtitle">
                {detentions.length}/{MAX_DETECTIONS_PER_SESSION} nablijven geregistreerd
                {hasDoublePeriod && ' • Strafstudie actief'}
              </p>
            </div>
          </div>
        </div>

        {/* Add New Form */}
        {showAddForm && newDetention && (
          <div className="card p-8 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-bold text-primary">Nieuwe nablijven toevoegen</h3>
              <div className="flex items-center gap-2">
                <DetentionTemplateManager
                  currentDetention={newDetention}
                  onSelectTemplate={(template) =>
                    setNewDetention((prev) => (prev ? { ...prev, ...template } : prev))
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewDetention(null);
                  }}
                  className="btn-ghost p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {(() => {
              const availableStudents = sortStudentsByClass(
                studentsForSession.filter(
                  (s) =>
                    !detentions.some(
                      (d) =>
                        getDetentionStudentName(d.student).toLowerCase() ===
                        s.name.trim().toLowerCase()
                    )
                )
              );
              return (
                <>
                  {availableStudents.length === 0 && (
                    <p className="text-amber-400 text-sm mb-4">Alle leerlingen voor deze sessie zijn al toegevoegd.</p>
                  )}
                  <DetentionForm
                    detention={newDetention}
                    students={availableStudents}
                    staffNames={staffNames}
                    allowStrafstudie={allowStrafstudie}
                    onChange={(field, value) => setNewDetention({ ...newDetention, [field]: value })}
                  />
                </>
              );
            })()}
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveNew} className="btn-primary flex items-center gap-2">
                <Save className="h-5 w-5" />
                Opslaan
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewDetention(null);
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {detentions.length === 0 && !showAddForm ? (
          <div className="card p-16 text-center">
            <p className="text-slate-400 font-medium mb-4">Geen nablijven geregistreerd voor deze datum.</p>
            <button onClick={handleAddNew} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="h-5 w-5" />
              Eerste Nablijven Toevoegen
            </button>
          </div>
        ) : (
          <div className="card p-4 sm:p-6 print:shadow-none">
            <DetentionSessionList
              detentions={detentions}
              students={studentsForSession}
              staffNames={staffNames}
              isMonday={isMonday}
              allowStrafstudie={allowStrafstudie}
              editingId={editingId}
              editingDetention={editingDetention}
              onReorder={handleReorder}
              onEdit={handleEdit}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onChange={(field, value) => {
                setEditingDetention((prev) => {
                  if (!prev) return null;
                  const next = { ...prev, [field]: value };
                  if (field === 'date' && typeof value === 'string') {
                    const parsed = parseSessionDate(value);
                    if (parsed) {
                      next.dayOfWeek = parsed.dayOfWeek;
                      if (parsed.dayOfWeek !== 'MAANDAG') {
                        next.isDoublePeriod = false;
                        next.timePeriod = undefined;
                      }
                      fetchStudents(parsed.dayOfWeek);
                    }
                  }
                  return next;
                });
              }}
              onDelete={handleDelete}
              onShowHistory={
                canViewHistory
                  ? (id) => {
                      setSelectedRecordId(id);
                      setShowAuditHistory(true);
                    }
                  : undefined
              }
            />
          </div>
        )}

        {showAuditHistory && selectedRecordId && (
          <div className="mt-6 space-y-6">
            <AuditHistory
              tableName="nablijven_detentions"
              recordId={selectedRecordId}
            />
            <FileAttachment
              recordId={selectedRecordId}
              recordType="detention"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowAuditHistory(false);
                  setSelectedRecordId(null);
                }}
                className="btn-secondary"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Componente para el formulario completo
function DetentionForm({
  detention,
  students,
  staffNames = [],
  allowStrafstudie = true,
  onChange,
}: {
  detention: Partial<Detention>;
  students: Student[];
  staffNames?: string[];
  allowStrafstudie?: boolean;
  onChange: (field: keyof Detention, value: any) => void;
}) {
  const isMonday = detention.dayOfWeek === 'MAANDAG';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="form-label">
          Leerling *
        </label>
        <select
          required
          value={detention.student || ''}
          onChange={(e) => onChange('student', e.target.value)}
          className="select-field w-full"
        >
          <option value="">Selecteer leerling...</option>
          {sortStudentsByClass(students).map((student) => (
            <option key={student.id} value={student.name}>
              {student.name} - {student.grade}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">
          Personeel *
        </label>
        <StaffNameInput
          value={detention.teacher || ''}
          onChange={(v) => onChange('teacher', v)}
          staffNames={staffNames}
          id="session-staff"
          required
        />
      </div>

      <div>
        <label className="form-label">
          Reden *
        </label>
        <input
          type="text"
          required
          value={detention.reason || ''}
          onChange={(e) => onChange('reason', e.target.value)}
          className="input-field"
          placeholder="Bijv: Te veel chill outs"
        />
      </div>

      <div>
        <label className="form-label">
          Opdracht
        </label>
        <input
          type="text"
          value={detention.task || ''}
          onChange={(e) => onChange('task', e.target.value)}
          className="input-field"
          placeholder="Taak voor de leerling"
        />
      </div>

      <div>
        <label className="form-label">
          Datum LVS *
        </label>
        <DateField
          required
          value={detention.lvsDate || ''}
          onChange={(v) => onChange('lvsDate', v)}
          className="input-field date-field w-full"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors border border-slate-600">
          <input
            type="checkbox"
            checked={detention.shouldPrint || false}
            onChange={(e) => onChange('shouldPrint', e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded border-slate-500 bg-slate-700"
          />
          <span className="text-sm font-medium text-slate-300">Afdrukken?</span>
        </label>
        <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors border border-slate-600">
          <input
            type="checkbox"
            checked={detention.canUseChromebook || false}
            onChange={(e) => onChange('canUseChromebook', e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded border-slate-500 bg-slate-700"
          />
          <span className="text-sm font-medium text-slate-300">Mag chromebook gebruiken?</span>
        </label>
        <label className="flex items-center gap-3 p-4 bg-red-600/20 rounded-xl hover:bg-red-600/30 cursor-pointer transition-colors border border-red-500/50">
          <input
            type="checkbox"
            checked={detention.nablijvenGeweigerd || false}
            onChange={(e) => onChange('nablijvenGeweigerd', e.target.checked)}
            className="h-5 w-5 text-red-600 focus:ring-red-500 rounded border-slate-500 bg-slate-700"
          />
          <span className="text-sm font-medium text-red-200">Nablijven geweigerd?</span>
        </label>
        {detention.nablijvenGeweigerd && !detention.isDoublePeriod && (
          <p className="text-xs text-amber-300/90 px-1 md:col-span-2">
            Leerling krijgt strafstudie op de eerstvolgende maandag. Meerdere weigeringen in dezelfde week horen bij één strafstudie.
          </p>
        )}
        {isMonday && allowStrafstudie && (
          <div className="flex items-center gap-3 p-4 bg-amber-600/20 rounded-xl hover:bg-amber-600/30 transition-colors border border-amber-500/50">
            <input
              type="checkbox"
              checked={!!detention.isDoublePeriod}
              onChange={(e) => {
                const isChecked = e.target.checked;
                onChange('isDoublePeriod', isChecked);
                if (!isChecked) {
                  onChange('timePeriod', undefined);
                }
              }}
              className="h-5 w-5 text-amber-600 focus:ring-amber-500 rounded border-slate-500 bg-slate-700 cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-sm font-bold text-amber-200">Strafstudie (16:00-17:40)</span>
              <p className="text-xs text-amber-300/70 mt-0.5">Alleen beschikbaar op maandag</p>
            </div>
          </div>
        )}
        {isMonday && !allowStrafstudie && (
          <div className="p-4 rounded-xl border border-orange-500/40 bg-orange-950/30 text-sm text-orange-200 md:col-span-2">
            Geen strafstudie op deze maandag — alleen gewoon nablijven.
          </div>
        )}
      </div>


      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Extra Opmerking
        </label>
        <textarea
          value={detention.extraNotes || ''}
          onChange={(e) => onChange('extraNotes', e.target.value)}
          rows={3}
          className="input-field"
          placeholder="Aanvullende notities..."
        />
      </div>
    </div>
  );
}
