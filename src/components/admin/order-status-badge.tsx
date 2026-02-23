import { Badge } from "@/components/ui/badge";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

const variantMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  green: "bg-green-100 text-green-800 border-green-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUSES[status as OrderStatus];
  if (!config) return <Badge variant="secondary">{status}</Badge>;

  return (
    <Badge variant="outline" className={variantMap[config.variant]}>
      {config.label}
    </Badge>
  );
}
