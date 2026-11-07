export function ChartSkeleton() {
  return (
    <div aria-hidden className="flex h-full w-full items-end gap-2 rounded-lg p-2">
      {[38, 62, 48, 76, 55, 88, 66, 44].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-slate-900/[0.055]"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
