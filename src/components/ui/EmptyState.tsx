type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
      )}
    </div>
  );
}
