'use client';

import { useEffect, useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { CHILLOUTS_ROLES, UserRole } from '@/lib/roles';
import { getStoredRole, setStoredRole } from '@/lib/auth';

export default function RoleSelector() {
  const [role, setRole] = useState<UserRole>('leerkracht');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const current = CHILLOUTS_ROLES.find((r) => r.id === role);

  return (
    <div className={`relative ${open ? 'z-[80]' : 'z-10'}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-secondary text-sm flex items-center gap-2"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{current?.label ?? 'Profiel'}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70]"
            aria-label="Sluiten"
            onClick={() => setOpen(false)}
          />
          <ul
            className="absolute right-0 top-full mt-2 z-[80] min-w-[240px] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl py-1"
            role="listbox"
          >
            {CHILLOUTS_ROLES.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={role === r.id}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 ${
                    role === r.id ? 'text-indigo-300 bg-indigo-500/10' : 'text-slate-200'
                  }`}
                  onClick={() => {
                    setRole(r.id);
                    setStoredRole(r.id);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium block">{r.label}</span>
                  <span className="text-xs text-slate-500">{r.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
