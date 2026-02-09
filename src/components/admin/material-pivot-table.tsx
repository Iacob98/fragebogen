import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEur } from "@/lib/format";

interface MaterialPivotProps {
  data: { name: string; qty: number; cost: number }[];
}

export function MaterialPivotTable({ data }: MaterialPivotProps) {
  const totalQty = data.reduce((sum, d) => sum + d.qty, 0);
  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead className="text-right w-24">Menge</TableHead>
            <TableHead className="text-right w-32">Kosten</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-right font-mono">
                {item.qty}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatEur(item.cost)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/50">
            <TableCell>Gesamt</TableCell>
            <TableCell className="text-right font-mono">{totalQty}</TableCell>
            <TableCell className="text-right font-mono">{formatEur(totalCost)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
