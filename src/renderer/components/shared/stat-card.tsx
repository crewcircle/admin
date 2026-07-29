export function StatCard({
  label,
  value,
  color = 'text-[#e4e4ed]',
  size = 'default',
}: {
  label: string;
  value: string;
  color?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const valueSize =
    size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
      <p className="text-xs text-[#8888a0] uppercase tracking-wider mb-1">{label}</p>
      <p className={`${valueSize} font-bold ${color}`}>{value}</p>
    </div>
  );
}
