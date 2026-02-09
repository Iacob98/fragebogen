"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Etwas ist schiefgelaufen</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
      </p>
      <Button onClick={reset}>Erneut versuchen</Button>
    </div>
  );
}
