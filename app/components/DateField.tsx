'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import nl from 'date-fns/locale/nl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarDaySetting } from '@/types';
import { isMonday, isNablijvenWeekday } from '@/lib/calendarUtils';
import { fetchCalendarDays, getDaySettingFromList } from '@/lib/calendarDaysClient';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  id?: string;
  min?: string;
  /** Alleen maandag, dinsdag en donderdag, en geen geblokkeerde kalenderdagen. */
  nablijvenOnly?: boolean;
};

function toDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

/** Datumveld dat dd/mm/jjjj toont; intern blijft yyyy-MM-dd. */
export default function DateField({
  value,
  onChange,
  className = 'input-field date-field w-full',
  required,
  id,
  min,
  nablijvenOnly = false,
}: Props) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [daySettings, setDaySettings] = useState<CalendarDaySetting[]>([]);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 288,
  });

  const openNativePicker = () => {
    const el = nativeRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker();
        return;
      }
    } catch {
      /* showPicker kan falen als de pagina geen user-gesture heeft */
    }
    el.focus();
    el.click();
  };

  const placePopover = () => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 288);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setPopoverStyle({
      top: rect.bottom + 8,
      left: Math.max(8, left),
      width,
    });
  };

  const openPicker = () => {
    if (!nablijvenOnly) {
      openNativePicker();
      return;
    }
    const base =
      value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date();
    setViewMonth(startOfMonth(base));
    placePopover();
    setOpen(true);
  };

  useEffect(() => {
    if (!open || !nablijvenOnly) return;
    placePopover();
    const onScroll = () => placePopover();
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, nablijvenOnly, viewMonth]);

  useEffect(() => {
    if (!open || !nablijvenOnly) return;
    const start = format(startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const end = format(endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    let cancelled = false;
    fetchCalendarDays(start, end)
      .then((days) => {
        if (!cancelled) setDaySettings(days);
      })
      .catch(() => {
        if (!cancelled) setDaySettings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, nablijvenOnly, viewMonth]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const selected = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : null;
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
  });

  const popover =
    nablijvenOnly && open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            className="rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl"
            style={{
              position: 'fixed',
              top: popoverStyle.top,
              left: popoverStyle.left,
              width: popoverStyle.width,
              zIndex: 80,
            }}
            role="dialog"
            aria-label="Kies een nablijfdag"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                className="btn-ghost p-1.5"
                aria-label="Vorige maand"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold capitalize text-slate-100">
                {format(viewMonth, 'LLLL yyyy', { locale: nl })}
              </p>
              <button
                type="button"
                className="btn-ghost p-1.5"
                aria-label="Volgende maand"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1 text-center text-[11px] font-semibold text-slate-500">
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const iso = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, viewMonth);
                const weekdayOk = isNablijvenWeekday(day);
                const cfg = getDaySettingFromList(iso, daySettings);
                const closed = !!cfg?.blocked || cfg?.allowDetentions === false;
                const noStrafstudie =
                  inMonth && weekdayOk && !closed && isMonday(day) && cfg?.allowStrafstudie === false;
                const selectable = inMonth && weekdayOk && !closed;
                const isSelected = !!selected && isSameDay(day, selected) && selectable;
                const reason = !weekdayOk
                  ? 'Geen nablijven op woensdag, vrijdag, zaterdag of zondag'
                  : cfg?.blocked
                    ? 'Deze dag is geblokkeerd op de kalender'
                    : cfg?.allowDetentions === false
                      ? 'Geen nablijven toegestaan op deze dag'
                      : noStrafstudie
                        ? 'Wel nablijven, geen strafstudie'
                        : undefined;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={!selectable}
                    title={reason}
                    aria-label={format(day, 'EEEE d MMMM yyyy', { locale: nl })}
                    onClick={() => {
                      if (!selectable) return;
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
                      !inMonth
                        ? 'text-slate-600'
                        : selectable
                          ? 'text-slate-100 hover:bg-indigo-500/30'
                          : 'cursor-not-allowed text-slate-600'
                    } ${closed && weekdayOk && inMonth ? 'bg-red-950/50 text-red-300/70' : ''} ${
                      noStrafstudie && !isSelected ? 'bg-violet-950/60 text-violet-200' : ''
                    } ${isSelected ? 'bg-indigo-500 text-white hover:bg-indigo-500' : ''}`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Alleen maandag, dinsdag en donderdag. Rood: geen nablijven. Paars: wel nablijven, geen strafstudie.
            </p>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="date-field-wrap" ref={wrapRef}>
      <input
        type="text"
        readOnly
        value={toDisplay(value)}
        placeholder="dd/mm/jjjj"
        className={className}
        id={id}
        required={required && !value}
        onClick={openPicker}
        onFocus={openPicker}
        aria-label={nablijvenOnly ? 'Datum nablijven' : 'Datum'}
        aria-haspopup={nablijvenOnly ? 'dialog' : undefined}
        aria-expanded={nablijvenOnly ? open : undefined}
      />
      {popover}
      {!nablijvenOnly && (
        <input
          ref={nativeRef}
          type="date"
          lang="nl-BE"
          min={min}
          value={value}
          tabIndex={-1}
          onChange={(e) => onChange(e.target.value)}
          className="date-field-native"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
