import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MaterialPivotProps {
  data: { name: string; qty: number }[];
}

export function MaterialPivotTable({ data }: MaterialPivotProps) {
  const total = data.reduce((sum, d) => sum + d.qty, 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead className="text-right w-24">Menge</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-right font-mono">
                {item.qty}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/50">
            <TableCell>Gesamt</TableCell>
            <TableCell className="text-right font-mono">{total}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
