'use client';

import { Suspense } from 'react';
import PortalEntryClient from './PortalEntryClient';

export default function PortalEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1a1208] text-[#f5e6d3]">
          <p className="text-sm tracking-wide">Sessie overnemen…</p>
        </div>
      }
    >
      <PortalEntryClient />
    </Suspense>
  );
}
