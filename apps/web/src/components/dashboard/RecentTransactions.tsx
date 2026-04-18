import { formatMoney, formatDate, statusColour } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  transactionDate: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const chipColour: Record<string, string> = {
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  danger: 'bg-red-500/15 text-red-400',
  default: 'bg-white/10 text-white/60',
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h3 className="text-base font-semibold text-white mb-4">Recent Transactions</h3>
      {transactions.length === 0 ? (
        <p className="text-white/40 text-sm">No recent transactions.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{tx.description}</p>
                <p className="text-xs text-white/40">{formatDate(tx.transactionDate)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-sm font-medium ${tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatMoney(tx.amount, tx.currency)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chipColour[statusColour(tx.status)]}`}>
                  {tx.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
