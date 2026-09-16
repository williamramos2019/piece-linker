import { cn } from "@/lib/utils";
import { STATUS_LABEL, type RequestStatus } from "@/lib/product-requests";

const STYLES: Record<RequestStatus, string> = {
  pendente: "bg-primary/25 text-foreground border-primary/60",
  em_analise: "bg-secondary text-secondary-foreground border-border",
  cadastrado: "bg-accent text-accent-foreground border-accent",
  recusado: "bg-destructive/15 text-destructive border-destructive/40",
};

export interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
