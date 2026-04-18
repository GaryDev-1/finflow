import { formatMoney, formatDate, statusColour } from '@/lib/utils';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface AccountCardProps {
  account: Account;
}

const typeLabel: Record<string, string> = {
  CHEQUE: 'Cheque',
  SAVINGS: 'Savings',
  CREDIT: 'Credit',
};

const chipColour: Record<string, string> = {
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  danger: 'bg-red-500/15 text-red-400',
  default: 'bg-white/10 text-white/60',
};

export function AccountCard({ account }: AccountCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-white/40 mb-1">{typeLabel[account.accountType] ?? account.accountType} Account</p>
          <p className="text-sm font-mono text-white/70">{account.accountNumber}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chipColour[statusColour(account.status)]}`}>
          {account.status}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs text-white/40 mb-1">Balance</p>
        <p className="text-2xl font-bold text-white">{formatMoney(account.balance, account.currency)}</p>
      </div>

      <p className="text-xs text-white/30">Opened {formatDate(account.createdAt)}</p>
    </div>
  );
}
