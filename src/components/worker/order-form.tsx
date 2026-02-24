"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Send, Package } from "lucide-react";
import { ORDER_PRIORITIES, type OrderPriority } from "@/lib/constants";

interface Material {
  id: number;
  name: string;
  imageKey: string | null;
}

interface OrderFormProps {
  materials: Material[];
}

const priorityOptions = (Object.keys(ORDER_PRIORITIES) as OrderPriority[]).map(
  (key) => ({ value: key, label: ORDER_PRIORITIES[key].label })
);

export function OrderForm({ materials }: OrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mtTeam, setMtTeam] = useLocalStorage("worker_mt_team", "");
  const [workerName, setWorkerName] = useLocalStorage("worker_name", "");
  const [priority, setPriority] = useState<OrderPriority>("NORMAL");
  const [comment, setComment] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const m of materials) init[m.id] = 0;
    return init;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mtTeam.trim()) {
      setError("MT Team обязательно");
      return;
    }
    if (!workerName.trim()) {
      setError("Имя обязательно");
      return;
    }

    const items = materials
      .map((m) => ({
        materialId: m.id,
        qty: quantities[m.id] || 0,
      }))
      .filter((i) => i.qty > 0);

    if (items.length === 0) {
      setError("Минимум один материал");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mtTeam,
          workerName,
          priority,
          comment: comment || undefined,
          items,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка при отправке");
        setSubmitting(false);
        return;
      }

      const result = await res.json();
      router.push(`/order/success?orderNumber=${result.orderNumber}`);
    } catch {
      setError("Ошибка сети. Попробуйте снова.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Общая информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mtTeam" className="text-sm">MT Team *</Label>
              <Input
                id="mtTeam"
                value={mtTeam}
                onChange={(e) => setMtTeam(e.target.value)}
                placeholder="z.B. MT 01"
                className="h-11 sm:h-9 text-base sm:text-sm"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workerName" className="text-sm">Имя работника *</Label>
              <Input
                id="workerName"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="Имя Фамилия"
                className="h-11 sm:h-9 text-base sm:text-sm"
                autoComplete="name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority" className="text-sm">Приоритет</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as OrderPriority)}
              className="w-full h-11 sm:h-9 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment" className="text-sm">Комментарий</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Необязательный комментарий..."
              rows={2}
              className="text-base sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Материалы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between gap-3 py-1.5 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {material.imageKey ? (
                    <img
                      src={`/api/materials/${material.id}/image`}
                      alt={material.name}
                      className="w-16 h-16 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Label className="text-sm leading-tight min-w-0">
                    {material.name}
                  </Label>
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={quantities[material.id] || ""}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [material.id]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-20 sm:w-24 h-10 sm:h-9 text-right text-base sm:text-sm shrink-0"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t sm:static sm:p-0 sm:border-0 sm:bg-transparent z-20">
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 sm:h-11 text-base sm:text-sm"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Отправить заказ
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
