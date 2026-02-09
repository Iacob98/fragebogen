import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
