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

interface TeamDetail {
  mtTeamNorm: string;
  totalSubmissions: number;
  totalQty: number;
  materialPivot: { name: string; qty: number }[];
  objects: {
    dehpNumber: string;
    totalQty: number;
    submissions: {
      id: string;
      createdAt: string;
      firstName: string;
      lastName: string;
      items: { qty: number; material: { name: string } }[];
    }[];
  }[];
}

export default function TeamDetailPage() {
  const params = useParams();
  const [data, setData] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `/api/teams/${encodeURIComponent(params.team as string)}`
      );
      if (res.ok) setData(await res.json());
      setLoading(false);
    };
    fetchData();
  }, [params.team]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Team nicht gefunden.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/teams">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Team: {data.mtTeamNorm}</h2>
        </div>
        <ExportButton
          type="team"
          extraParams={{ mtTeam: data.mtTeamNorm }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{data.totalSubmissions}</p>
            <p className="text-sm text-muted-foreground">Meldungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{data.objects.length}</p>
            <p className="text-sm text-muted-foreground">Objekte</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{data.totalQty}</p>
            <p className="text-sm text-muted-foreground">Gesamtmenge</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialPivotTable data={data.materialPivot} />
        </CardContent>
      </Card>

      {data.objects.map((obj) => (
        <Card key={obj.dehpNumber}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Link
                href={`/admin/objects/${encodeURIComponent(obj.dehpNumber)}`}
                className="text-primary hover:underline"
              >
                {obj.dehpNumber}
              </Link>
              <span className="text-sm font-normal text-muted-foreground">
                Menge: {obj.totalQty}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Menge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obj.submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Link
                          href={`/admin/submissions/${sub.id}`}
                          className="text-primary hover:underline"
                        >
                          {format(new Date(sub.createdAt), "dd.MM.yyyy HH:mm")}
                        </Link>
                      </TableCell>
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
      ))}
    </div>
  );
}
