"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { FilterBar, FilterField } from "@/components/admin/filter-bar";
import { ExportButton } from "@/components/admin/export-button";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { formatEur, formatOrderNumber } from "@/lib/format";
import { ORDER_STATUSES, ORDER_PRIORITIES, type OrderStatus, type OrderPriority } from "@/lib/constants";

interface OrderRow {
  id: string;
  orderNumber: number;
  createdAt: string;
  mtTeamNorm: string;
  branchAddress: string;
  workerName: string;
  priority: string;
  status: string;
  items: { qty: number; unitPrice: number }[];
}

const statusOptions = [
  { value: "", label: "Alle" },
  ...Object.entries(ORDER_STATUSES).map(([key, val]) => ({
    value: key,
    label: val.label,
  })),
];

const priorityOptions = [
  { value: "", label: "Alle" },
  ...Object.entries(ORDER_PRIORITIES).map(([key, val]) => ({
    value: key,
    label: val.label,
  })),
];

const filterFields: FilterField[] = [
  { name: "from", label: "Von", type: "date" },
  { name: "to", label: "Bis", type: "date" },
  { name: "mtTeam", label: "MT Team", type: "text", placeholder: "z.B. MT 01" },
  { name: "status", label: "Status", type: "select", options: statusOptions },
  { name: "priority", label: "Priorität", type: "select", options: priorityOptions },
];

const columns: Column<OrderRow>[] = [
  {
    header: "Nr.",
    accessor: (row) => formatOrderNumber(row.orderNumber),
  },
  {
    header: "Datum",
    accessor: (row) => format(new Date(row.createdAt), "dd.MM.yyyy HH:mm"),
  },
  { header: "MT Team", accessor: "mtTeamNorm" },
  {
    header: "Filiale",
    accessor: (row) => row.branchAddress || "—",
  },
  { header: "Name", accessor: "workerName" },
  {
    header: "Priorität",
    accessor: (row) => {
      const p = ORDER_PRIORITIES[row.priority as OrderPriority];
      return row.priority === "URGENT" ? (
        <Badge variant="destructive">{p?.label ?? row.priority}</Badge>
      ) : (
        <span>{p?.label ?? row.priority}</span>
      );
    },
  },
  {
    header: "Status",
    accessor: (row) => <OrderStatusBadge status={row.status} />,
  },
  {
    header: "Menge",
    accessor: (row) => row.items.reduce((sum, i) => sum + i.qty, 0),
    className: "text-right",
  },
  {
    header: "Kosten",
    accessor: (row) =>
      formatEur(row.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)),
    className: "text-right",
  },
];

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetch(`/api/orders?${searchParams.toString()}`);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
      setPage(json.page || 1);
      setTotalPages(json.totalPages || 1);
      setLoading(false);
    };
    fetchData();
  }, [searchParams]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Заказы</h2>
        <ExportButton type="orders" />
      </div>

      <FilterBar fields={filterFields} basePath="/admin/orders" />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
          />
          <Pagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  );
}
