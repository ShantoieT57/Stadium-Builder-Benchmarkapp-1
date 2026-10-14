import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transactions | Transaction Import',
};

export default function TransactionsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Transactions</h1>
    </div>
  );
}
