interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = "No results found.",
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
