import { formatMoney } from '@/lib/utils';

interface SummaryCardProps {
  label: string;
  value: number;
  type: 'money' | 'count';
  accent: 'primary' | 'secondary' | 'danger';
}

const accentClass: Record<SummaryCardProps['accent'], string> = {
  primary: 'text-blue-400',
  secondary: 'text-purple-400',
  danger: 'text-red-400',
};

export function SummaryCard({ label, value, type, accent }: SummaryCardProps) {
  const displayValue = type === 'money' ? formatMoney(value) : value.toLocaleString();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-sm text-white/50 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accentClass[accent]}`}>{displayValue}</p>
    </div>
  );
}
