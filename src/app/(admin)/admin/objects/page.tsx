"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { FilterBar, FilterField } from "@/components/admin/filter-bar";
import { ExportButton } from "@/components/admin/export-button";
import { DuplicateBadge } from "@/components/admin/duplicate-badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { formatEur } from "@/lib/format";

interface ObjectRow {
  dehpNumber: string;
  totalQty: number;
  totalCost: number;
  submissionCount: number;
  mtTeams: string[];
  lastDate: string;
  isDuplicate: boolean;
}

const filterFields: FilterField[] = [
  { name: "search", label: "DEHP Suche", type: "text", placeholder: "DEHP Nummer" },
];

const columns: Column<ObjectRow>[] = [
  {
    header: "DEHP Nummer",
    accessor: (row) => (
      <span className="flex items-center gap-2">
        {row.dehpNumber}
        {row.isDuplicate && <DuplicateBadge />}
      </span>
    ),
  },
  {
    header: "Meldungen",
    accessor: "submissionCount",
    className: "text-right",
  },
  {
    header: "MT Teams",
    accessor: (row) => row.mtTeams.join(", "),
  },
  {
    header: "Gesamtmenge",
    accessor: "totalQty",
    className: "text-right",
  },
  {
    header: "Gesamtkosten",
    accessor: (row) => formatEur(row.totalCost),
    className: "text-right",
  },
  {
    header: "Letzte Meldung",
    accessor: (row) => format(new Date(row.lastDate), "dd.MM.yyyy"),
  },
];

export default function ObjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ObjectRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetch(`/api/objects?${searchParams.toString()}`);
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
        <h2 className="text-2xl font-bold">Objekte (DEHP)</h2>
        <ExportButton type="object" />
      </div>

      <FilterBar fields={filterFields} basePath="/admin/objects" />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(row) =>
              router.push(`/admin/objects/${encodeURIComponent(row.dehpNumber)}`)
            }
          />
          <Pagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  );
}
