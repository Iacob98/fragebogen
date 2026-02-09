"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DuplicateBadge } from "@/components/admin/duplicate-badge";
import { PhotoGallery } from "@/components/admin/photo-gallery";
import { MaterialPivotTable } from "@/components/admin/material-pivot-table";
import { format } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SubmissionDetail {
  id: string;
  createdAt: string;
  mtTeamNorm: string;
  mtTeamRaw: string;
  dehpNumber: string;
  firstName: string;
  lastName: string;
  comment: string | null;
  isDuplicate: boolean;
  items: {
    qty: number;
    material: { name: string };
  }[];
  attachments: {
    id: number;
    filename: string;
  }[];
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/submissions/${params.id}`);
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    };
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Meldung nicht gefunden.</p>;
  }

  const materialData = data.items.map((item) => ({
    name: item.material.name,
    qty: item.qty,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/submissions">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Meldung Details</h2>
        {data.isDuplicate && <DuplicateBadge />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Datum" value={format(new Date(data.createdAt), "dd.MM.yyyy HH:mm")} />
            <InfoRow label="MT Team" value={data.mtTeamNorm} />
            <InfoRow label="DEHP Nummer" value={data.dehpNumber} />
            <InfoRow label="Name" value={`${data.firstName} ${data.lastName}`} />
            {data.comment && (
              <div>
                <p className="text-sm text-muted-foreground">Kommentar</p>
                <p className="text-sm mt-1 bg-muted/50 p-2 rounded">{data.comment}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant="secondary">
                ID: {data.id.slice(0, 8)}...
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materialien</CardTitle>
          </CardHeader>
          <CardContent>
            <MaterialPivotTable data={materialData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fotos ({data.attachments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGallery attachments={data.attachments} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
