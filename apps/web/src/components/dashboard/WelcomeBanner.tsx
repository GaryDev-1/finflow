'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeBanner() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    setUsername(user?.username ?? null);
  }, []);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-white">
        {username ? `${greeting()}, ${username}` : greeting()}
      </h1>
      <p className="text-sm text-white/40 mt-1">Here's what's happening with your finances today.</p>
    </div>
  );
}
