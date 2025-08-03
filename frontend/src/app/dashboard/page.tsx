// src/app/dashboard/page.tsx
'use client';

import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <Dashboard />
    </div>
  );
}