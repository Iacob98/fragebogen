export function normalizeMtTeam(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}
