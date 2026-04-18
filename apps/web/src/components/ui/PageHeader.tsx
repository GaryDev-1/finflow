interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-white/50 text-sm">{subtitle}</p>
      )}
    </div>
  );
}
