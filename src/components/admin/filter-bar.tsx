"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, X } from "lucide-react";

export type FilterField =
  | {
      name: string;
      label: string;
      type: "text" | "date";
      placeholder?: string;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
    };

interface FilterBarProps {
  fields: FilterField[];
  basePath: string;
}

export function FilterBar({ fields, basePath }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of fields) {
      init[field.name] = searchParams.get(field.name) || "";
    }
    return init;
  });

  const apply = useCallback(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
    }
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  }, [values, router, basePath]);

  const reset = useCallback(() => {
    const cleared: Record<string, string> = {};
    for (const field of fields) {
      cleared[field.name] = "";
    }
    setValues(cleared);
    router.push(basePath);
  }, [fields, router, basePath]);

  return (
    <div className="flex flex-wrap gap-3 items-end mb-4 p-4 bg-muted/30 rounded-lg">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1">
          <Label htmlFor={field.name} className="text-xs">
            {field.label}
          </Label>
          {field.type === "select" ? (
            <select
              id={field.name}
              value={values[field.name] || ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
              }
              className="w-40 h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={field.name}
              type={field.type}
              placeholder={"placeholder" in field ? field.placeholder : undefined}
              value={values[field.name] || ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
              }
              className="w-40 h-9"
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
          )}
        </div>
      ))}
      <Button size="sm" onClick={apply} className="h-9">
        <Search className="h-4 w-4 mr-1" />
        Filtern
      </Button>
      <Button size="sm" variant="outline" onClick={reset} className="h-9">
        <X className="h-4 w-4 mr-1" />
        Zurücksetzen
      </Button>
    </div>
  );
}
