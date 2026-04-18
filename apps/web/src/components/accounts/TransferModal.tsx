'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import Link from 'next/link';
import { TRANSFER_MUTATION } from '@/graphql/mutations/transfer';
import { formatMoney } from '@/lib/utils';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
}

interface TransferModalProps {
  fromAccount: Account;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}

interface TransferResult {
  fromAccount: { id: string; balance: number };
  toAccount: { id: string; balance: number };
  debitTransaction: { id: string; amount: number };
}

const typeLabel: Record<string, string> = { CHEQUE: 'Cheque', SAVINGS: 'Savings', CREDIT: 'Credit' };

export function TransferModal({ fromAccount, accounts, onClose, onSuccess }: TransferModalProps) {
  const eligibleTargets = accounts.filter((a) => a.id !== fromAccount.id && a.status === 'ACTIVE');

  const [toAccountId, setToAccountId] = useState(eligibleTargets[0]?.id ?? '');
  const [amountRand, setAmountRand] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ amount: number; toLabel: string } | null>(null);

  const [transfer, { loading }] = useMutation(TRANSFER_MUTATION, {
    onCompleted(raw) {
      const data = raw as { transfer: TransferResult };
      const toAcc = accounts.find((a) => a.id === toAccountId);
      const toLabel = toAcc
        ? `${typeLabel[toAcc.accountType] ?? toAcc.accountType} · ${toAcc.accountNumber}`
        : 'destination account';
      setSuccess({ amount: data.transfer.debitTransaction.amount, toLabel });
      onSuccess();
    },
    onError(err) {
      setError(err.message);
    },
  });

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    const cents = Math.round(parseFloat(amountRand) * 100);
    if (isNaN(cents) || cents <= 0) {
      setError('Enter a valid amount');
      return;
    }
    transfer({
      variables: {
        fromAccountId: fromAccount.id,
        toAccountId,
        amount: cents,
        description: description || 'Transfer',
      },
    });
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[oklch(0.15_0.01_250)] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl text-center">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Transfer complete</h2>
          <p className="text-white/50 text-sm mb-1">
            {formatMoney(success.amount, fromAccount.currency)} sent to
          </p>
          <p className="text-white font-medium text-sm mb-6">{success.toLabel}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-white/10 text-white/60 hover:text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              Done
            </button>
            <Link
              href="/transactions"
              onClick={onClose}
              className="flex-1 bg-[oklch(0.6_0.2_250)] hover:bg-[oklch(0.65_0.2_250)] text-white font-semibold rounded-lg py-2.5 text-sm text-center transition-colors"
            >
              View transactions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[oklch(0.15_0.01_250)] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Transfer Funds</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        <div className="bg-white/5 rounded-xl p-3 mb-5 flex justify-between items-center">
          <div>
            <p className="text-xs text-white/40 mb-0.5">From</p>
            <p className="text-sm font-medium text-white">
              {typeLabel[fromAccount.accountType] ?? fromAccount.accountType} · {fromAccount.accountNumber}
            </p>
          </div>
          <p className="text-sm font-semibold text-white">{formatMoney(fromAccount.balance, fromAccount.currency)}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">To Account</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              required
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[oklch(0.6_0.2_250)] transition-colors"
            >
              {eligibleTargets.length === 0 && <option value="">No eligible accounts</option>}
              {eligibleTargets.map((a) => (
                <option key={a.id} value={a.id} className="bg-[oklch(0.15_0.01_250)]">
                  {typeLabel[a.accountType] ?? a.accountType} · {a.accountNumber} ({formatMoney(a.balance, a.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Amount (R)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amountRand}
              onChange={(e) => setAmountRand(e.target.value)}
              placeholder="0.00"
              required
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[oklch(0.6_0.2_250)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Rent payment"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[oklch(0.6_0.2_250)] transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/10 text-white/60 hover:text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || eligibleTargets.length === 0}
              className="flex-1 bg-[oklch(0.6_0.2_250)] hover:bg-[oklch(0.65_0.2_250)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? 'Transferring…' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
