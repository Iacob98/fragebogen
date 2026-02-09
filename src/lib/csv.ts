import Papa from "papaparse";

export function generateCsv(data: Record<string, unknown>[]): string {
  const csv = Papa.unparse(data, {
    delimiter: ";",
  });
  return "\uFEFF" + csv;
}
