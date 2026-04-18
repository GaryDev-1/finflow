/**
 * Format an integer cent value as a ZAR currency string.
 * e.g. 1245050 → "R 12 450.50"
 */
export function formatMoney(cents: number, currency = 'ZAR'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO 8601 date string to a human-readable date.
 * e.g. "2026-01-15T00:00:00Z" → "15 Jan 2026"
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Return a Tailwind colour class for account/loan/transaction status chips.
 */
export function statusColour(status: string): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'PAID':
      return 'success';
    case 'FROZEN':
    case 'PENDING':
    case 'UPCOMING':
    case 'PARTIAL':
      return 'warning';
    case 'CLOSED':
    case 'DEFAULTED':
    case 'FAILED':
    case 'REVERSED':
    case 'OVERDUE':
    case 'REJECTED':
      return 'danger';
    default:
      return 'default';
  }
}
