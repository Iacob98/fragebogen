const eurFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(value: number): string {
  return eurFormatter.format(value);
}

export function formatOrderNumber(n: number): string {
  return `ЗЗ-${String(n).padStart(4, "0")}`;
}
