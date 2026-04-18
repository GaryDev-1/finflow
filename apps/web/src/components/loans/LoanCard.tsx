'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { MAKE_REPAYMENT_MUTATION } from '@/graphql/mutations/repayment';
import { formatMoney, formatDate, statusColour } from '@/lib/utils';

interface Repayment {
  id: string;
  dueDate: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

interface Loan {
  id: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  termMonths: number;
  monthlyInstalment: number;
  status: string;
  disbursedAt: string | null;
  nextPaymentDate: string | null;
  currency: string;
  createdAt: string;
  repayments: Repayment[];
}

interface LoanCardProps {
  loan: Loan;
}

const chipColour: Record<string, string> = {
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  danger: 'bg-red-500/15 text-red-400',
  default: 'bg-white/10 text-white/60',
};

export function LoanCard({ loan }: LoanCardProps) {
  const router = useRouter();
  const [payError, setPayError] = useState('');

  const paidRepayments = loan.repayments.filter((r) => r.status === 'PAID').length;
  const totalRepayments = loan.repayments.length;
  const progressPct = totalRepayments > 0 ? Math.round((paidRepayments / totalRepayments) * 100) : 0;

  const nextPayable = loan.repayments.find(
    (r) => r.status === 'UPCOMING' || r.status === 'OVERDUE'
  );

  const [makeRepayment, { loading }] = useMutation(MAKE_REPAYMENT_MUTATION, {
    onCompleted() {
      setPayError('');
      router.refresh();
    },
    onError(err) {
      setPayError(err.message);
    },
  });

  function handlePay() {
    if (!nextPayable) return;
    setPayError('');
    makeRepayment({ variables: { loanId: loan.id, repaymentId: nextPayable.id } });
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-white/40 font-mono mb-1">#{loan.id.slice(-12)}</p>
          <p className="text-sm text-white/60">{loan.termMonths}-month term · {loan.interestRate}% p.a.</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chipColour[statusColour(loan.status)]}`}>
          {loan.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-white/40 mb-1">Principal</p>
          <p className="text-base font-semibold text-white">{formatMoney(loan.principalAmount, loan.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1">Outstanding</p>
          <p className="text-base font-semibold text-red-400">{formatMoney(loan.outstandingBalance, loan.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1">Monthly</p>
          <p className="text-base font-semibold text-white">{formatMoney(loan.monthlyInstalment, loan.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1">Next Payment</p>
          <p className="text-base font-semibold text-white">
            {loan.nextPaymentDate ? formatDate(loan.nextPaymentDate) : '—'}
          </p>
        </div>
      </div>

      {totalRepayments > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>Repayments</span>
            <span>{paidRepayments}/{totalRepayments} ({progressPct}%)</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {nextPayable && loan.status === 'ACTIVE' && (
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 mb-0.5">Next instalment due {formatDate(nextPayable.dueDate)}</p>
              <p className="text-sm font-semibold text-white">{formatMoney(nextPayable.amount, loan.currency)}</p>
            </div>
            <button
              onClick={handlePay}
              disabled={loading}
              className="bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 text-green-400 font-semibold rounded-lg px-4 py-2 text-xs transition-colors"
            >
              {loading ? 'Processing…' : 'Pay now'}
            </button>
          </div>
          {payError && <p className="text-red-400 text-xs mt-2">{payError}</p>}
        </div>
      )}

      {loan.disbursedAt && (
        <p className="text-xs text-white/30 mt-3">Disbursed {formatDate(loan.disbursedAt)}</p>
      )}
    </div>
  );
}
