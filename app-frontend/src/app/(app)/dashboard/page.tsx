import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard | Transaction Import' };

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
    </div>
  );
}
