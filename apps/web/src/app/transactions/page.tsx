'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { TRANSACTIONS_QUERY } from '@/graphql/queries/transactions';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatMoney } from '@/lib/utils';

const PAGE_SIZE = 15;

export default function TransactionsPage() {
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery(TRANSACTIONS_QUERY, {
    variables: { page, limit: PAGE_SIZE },
    fetchPolicy: 'network-only',
  });

  const result = data as any;
  const transactions = result?.transactions?.transactions ?? [];
  const summary = result?.transactions?.summary;
  const total: number = result?.transactions?.pageInfo?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader title="Transactions" subtitle={`${total} transactions`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-white/50">Total Credits</p>
          <p className="text-lg font-semibold text-green-400">
            {formatMoney(summary?.totalCredits ?? 0)}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-white/50">Total Debits</p>
          <p className="text-lg font-semibold text-red-400">
            {formatMoney(summary?.totalDebits ?? 0)}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-white/50">Net Balance</p>
          <p className={`text-lg font-semibold ${(summary?.netBalance ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatMoney(summary?.netBalance ?? 0)}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-white/50">Count</p>
          <p className="text-lg font-semibold text-white">{summary?.transactionCount ?? 0}</p>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4">Failed to load transactions: {error.message}</p>
      )}

      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-white/50 text-sm">Loading transactions…</p>
        </div>
      ) : (
        <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
          <TransactionTable transactions={transactions} />
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-white/40">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
