"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { FilterBar, FilterField } from "@/components/admin/filter-bar";
import { ExportButton } from "@/components/admin/export-button";
import { Loader2 } from "lucide-react";

interface TeamRow {
  mtTeamNorm: string;
  totalQty: number;
  objectCount: number;
  submissionCount: number;
}

const filterFields: FilterField[] = [
  { name: "search", label: "Team Suche", type: "text", placeholder: "z.B. MT 01" },
];

const columns: Column<TeamRow>[] = [
  { header: "MT Team", accessor: "mtTeamNorm" },
  {
    header: "Objekte",
    accessor: "objectCount",
    className: "text-right",
  },
  {
    header: "Meldungen",
    accessor: "submissionCount",
    className: "text-right",
  },
  {
    header: "Gesamtmenge",
    accessor: "totalQty",
    className: "text-right",
  },
];

export default function TeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<TeamRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetch(`/api/teams?${searchParams.toString()}`);
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
        <h2 className="text-2xl font-bold">Teams</h2>
        <ExportButton type="team" />
      </div>

      <FilterBar fields={filterFields} basePath="/admin/teams" />

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
              router.push(
                `/admin/teams/${encodeURIComponent(row.mtTeamNorm)}`
              )
            }
          />
          <Pagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  );
}
