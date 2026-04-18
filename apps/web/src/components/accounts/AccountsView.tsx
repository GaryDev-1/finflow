'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountCard } from './AccountCard';
import { TransferModal } from './TransferModal';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
}

export function AccountsView({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [transferFrom, setTransferFrom] = useState<Account | null>(null);

  function handleTransferSuccess() {
    router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="flex flex-col gap-2">
            <AccountCard account={account} />
            {account.status === 'ACTIVE' && (
              <button
                onClick={() => setTransferFrom(account)}
                className="w-full border border-white/10 hover:border-[oklch(0.6_0.2_250)]/50 text-white/50 hover:text-[oklch(0.6_0.2_250)] rounded-lg py-2 text-xs font-medium transition-colors"
              >
                Transfer funds
              </button>
            )}
          </div>
        ))}
      </div>

      {transferFrom && (
        <TransferModal
          fromAccount={transferFrom}
          accounts={accounts}
          onClose={() => setTransferFrom(null)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </>
  );
}
