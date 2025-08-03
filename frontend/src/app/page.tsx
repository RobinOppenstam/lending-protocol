// src/app/page.tsx
'use client';

import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { OracleAdmin } from '@/components/OracleAdmin';

export default function Home() {
  return (
    <main className="min-h-screen gradient-bg">
      <Header />
      <Dashboard />
      <OracleAdmin />
    </main>
  );
}