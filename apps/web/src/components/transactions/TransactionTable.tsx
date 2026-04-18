'use client';

import { formatMoney, formatDate, statusColour } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  transactionDate: string;
  reference: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const chipColour: Record<string, string> = {
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  danger: 'bg-red-500/15 text-red-400',
  default: 'bg-white/10 text-white/60',
};

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return <p className="text-white/40 text-sm py-8 text-center">No transactions found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-white/50 text-xs">
            <th className="text-left px-4 py-3 font-medium">DATE</th>
            <th className="text-left px-4 py-3 font-medium">DESCRIPTION</th>
            <th className="text-left px-4 py-3 font-medium">REFERENCE</th>
            <th className="text-left px-4 py-3 font-medium">TYPE</th>
            <th className="text-right px-4 py-3 font-medium">AMOUNT</th>
            <th className="text-left px-4 py-3 font-medium">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-white/70">{formatDate(tx.transactionDate)}</td>
              <td className="px-4 py-3 max-w-50 truncate text-white/80">{tx.description}</td>
              <td className="px-4 py-3 font-mono text-xs text-white/40">{tx.reference}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium ${tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type}
                </span>
              </td>
              <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'CREDIT' ? '+' : '-'}{formatMoney(tx.amount, tx.currency)}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chipColour[statusColour(tx.status)]}`}>
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
