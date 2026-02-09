"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface ExportButtonProps {
  type: string;
  label?: string;
  extraParams?: Record<string, string>;
}

export function ExportButton({
  type,
  label = "CSV Export",
  extraParams,
}: ExportButtonProps) {
  const searchParams = useSearchParams();

  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    params.delete("page");
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        params.set(k, v);
      }
    }
    window.open(`/api/export?${params.toString()}`, "_blank");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
}
