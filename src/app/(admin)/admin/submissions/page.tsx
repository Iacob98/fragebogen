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

interface SubmissionRow {
  id: string;
  createdAt: string;
  mtTeamNorm: string;
  dehpNumber: string;
  firstName: string;
  lastName: string;
  isDuplicate: boolean;
  items: { qty: number }[];
}

const filterFields: FilterField[] = [
  { name: "from", label: "Von", type: "date" },
  { name: "to", label: "Bis", type: "date" },
  { name: "mtTeam", label: "MT Team", type: "text", placeholder: "z.B. MT 01" },
  { name: "dehp", label: "DEHP", type: "text", placeholder: "DEHP Nummer" },
  { name: "lastName", label: "Nachname", type: "text", placeholder: "Nachname" },
];

const columns: Column<SubmissionRow>[] = [
  {
    header: "Datum",
    accessor: (row) => format(new Date(row.createdAt), "dd.MM.yyyy HH:mm"),
  },
  { header: "MT Team", accessor: "mtTeamNorm" },
  {
    header: "DEHP",
    accessor: (row) => (
      <span className="flex items-center gap-2">
        {row.dehpNumber}
        {row.isDuplicate && <DuplicateBadge />}
      </span>
    ),
  },
  { header: "Vorname", accessor: "firstName" },
  { header: "Nachname", accessor: "lastName" },
  {
    header: "Menge",
    accessor: (row) => row.items.reduce((sum, i) => sum + i.qty, 0),
    className: "text-right",
  },
];

export default function SubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<SubmissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetch(`/api/submissions?${searchParams.toString()}`);
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
        <h2 className="text-2xl font-bold">Meldungen</h2>
        <ExportButton type="submissions" />
      </div>

      <FilterBar fields={filterFields} basePath="/admin/submissions" />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(row) => router.push(`/admin/submissions/${row.id}`)}
          />
          <Pagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  );
}
