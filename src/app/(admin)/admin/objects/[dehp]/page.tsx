"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MaterialPivotTable } from "@/components/admin/material-pivot-table";
import { ExportButton } from "@/components/admin/export-button";
import { format } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ObjectDetail {
  dehpNumber: string;
  totalQty: number;
  totalCost: number;
  materialPivot: { name: string; qty: number; cost: number }[];
  submissions: {
    id: string;
    createdAt: string;
    mtTeamNorm: string;
    firstName: string;
    lastName: string;
    items: { qty: number; material: { name: string } }[];
  }[];
}

export default function ObjectDetailPage() {
  const params = useParams();
  const [data, setData] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `/api/objects/${encodeURIComponent(params.dehp as string)}`
      );
      if (res.ok) setData(await res.json());
      setLoading(false);
    };
    fetchData();
  }, [params.dehp]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Objekt nicht gefunden.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/objects">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">
            Objekt: {data.dehpNumber}
          </h2>
        </div>
        <ExportButton
          type="object"
          extraParams={{ dehpNumber: data.dehpNumber }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialPivotTable data={data.materialPivot} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Meldungen ({data.submissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>MT Team</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Menge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Link
                        href={`/admin/submissions/${sub.id}`}
                        className="text-primary hover:underline"
                      >
                        {format(new Date(sub.createdAt), "dd.MM.yyyy HH:mm")}
                      </Link>
                    </TableCell>
                    <TableCell>{sub.mtTeamNorm}</TableCell>
                    <TableCell>
                      {sub.firstName} {sub.lastName}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {sub.items.reduce((sum, i) => sum + i.qty, 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
