import { formatMoney, formatDate, statusColour } from '@/lib/utils';

interface Loan {
  id: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  status: string;
  nextPaymentDate: string | null;
  monthlyInstalment: number;
  currency: string;
}

interface LoanStatusWidgetProps {
  loans: Loan[];
}

const chipColour: Record<string, string> = {
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  danger: 'bg-red-500/15 text-red-400',
  default: 'bg-white/10 text-white/60',
};

export function LoanStatusWidget({ loans }: LoanStatusWidgetProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h3 className="text-base font-semibold text-white mb-4">Active Loans</h3>
      {loans.length === 0 ? (
        <p className="text-white/40 text-sm">No active loans.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {loans.map((loan) => (
            <li key={loan.id} className="border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60 font-mono">#{loan.id.slice(-8)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chipColour[statusColour(loan.status)]}`}>
                  {loan.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-white/40 text-xs">Outstanding</p>
                  <p className="text-white font-medium">{formatMoney(loan.outstandingBalance, loan.currency)}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Monthly</p>
                  <p className="text-white font-medium">{formatMoney(loan.monthlyInstalment, loan.currency)}</p>
                </div>
                {loan.nextPaymentDate && (
                  <div className="col-span-2">
                    <p className="text-white/40 text-xs">Next Payment</p>
                    <p className="text-white font-medium">{formatDate(loan.nextPaymentDate)}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
