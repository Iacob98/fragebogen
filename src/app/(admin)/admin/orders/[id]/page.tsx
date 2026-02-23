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
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { MaterialPivotTable } from "@/components/admin/material-pivot-table";
import { format } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatEur, formatOrderNumber } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  ORDER_PRIORITIES,
  type OrderStatus,
  type OrderPriority,
} from "@/lib/constants";

interface OrderDetail {
  id: string;
  orderNumber: number;
  createdAt: string;
  mtTeamNorm: string;
  mtTeamRaw: string;
  branchAddress: string;
  workerName: string;
  comment: string | null;
  priority: string;
  status: string;
  supplier: string | null;
  statusNote: string | null;
  items: {
    qty: number;
    unitPrice: number;
    material: { name: string; articleNumber?: string | null };
  }[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState("");

  const fetchData = async () => {
    const res = await fetch(`/api/orders/${params.id}`);
    if (res.ok) {
      const order = await res.json();
      setData(order);
      setNewStatus("");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setError(null);
    setUpdating(true);

    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Fehler beim Aktualisieren");
        setUpdating(false);
        return;
      }

      const updated = await res.json();
      setData(updated);
      setNewStatus("");
    } catch {
      setError("Netzwerkfehler");
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Заказ не найден.</p>;
  }

  const materialData = data.items.map((item) => ({
    name: item.material.articleNumber
      ? `${item.material.name} (${item.material.articleNumber})`
      : item.material.name,
    qty: item.qty,
    cost: item.qty * item.unitPrice,
  }));

  const currentStatus = data.status as OrderStatus;
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  const priorityLabel = ORDER_PRIORITIES[data.priority as OrderPriority]?.label ?? data.priority;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">
          Заказ {formatOrderNumber(data.orderNumber)}
        </h2>
        <OrderStatusBadge status={data.status} />
        {data.priority === "URGENT" && (
          <Badge variant="destructive">Срочный</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Номер" value={formatOrderNumber(data.orderNumber)} />
            <InfoRow label="Дата" value={format(new Date(data.createdAt), "dd.MM.yyyy HH:mm")} />
            <InfoRow label="MT Team" value={data.mtTeamNorm} />
            {data.branchAddress && <InfoRow label="Филиал" value={data.branchAddress} />}
            <InfoRow label="Имя" value={data.workerName} />
            <InfoRow label="Приоритет" value={priorityLabel} />
            {data.supplier && <InfoRow label="Поставщик" value={data.supplier} />}
            {data.comment && (
              <div>
                <p className="text-sm text-muted-foreground">Комментарий</p>
                <p className="text-sm mt-1 bg-muted/50 p-2 rounded">{data.comment}</p>
              </div>
            )}
            {data.statusNote && (
              <div>
                <p className="text-sm text-muted-foreground">Заметка к статусу</p>
                <p className="text-sm mt-1 bg-muted/50 p-2 rounded">{data.statusNote}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Материалы</CardTitle>
          </CardHeader>
          <CardContent>
            <MaterialPivotTable data={materialData} />
          </CardContent>
        </Card>
      </div>

      {allowedTransitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Управление статусом</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Новый статус</p>
              <div className="flex flex-wrap gap-2">
                {allowedTransitions.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={newStatus === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewStatus(s)}
                  >
                    {ORDER_STATUSES[s].label}
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleStatusUpdate}
              disabled={!newStatus || updating}
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Обновление...
                </>
              ) : (
                "Обновить статус"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
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
