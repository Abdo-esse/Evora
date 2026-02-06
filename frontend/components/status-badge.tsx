import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-foreground text-background",
  CANCELED: "bg-destructive text-destructive-foreground",
  PENDING: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-foreground text-background",
  REFUSED: "bg-destructive text-destructive-foreground",
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-xs font-medium",
        statusStyles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}
