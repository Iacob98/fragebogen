export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { OrderForm } from "@/components/worker/order-form";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Заказ материалов",
};

export default async function OrderPage() {
  const materials = await prisma.material.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="px-4 py-3 sm:py-4 max-w-2xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold">Заказ материалов</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Заполните все обязательные поля (*)
          </p>
        </div>
      </header>
      <main className="px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-6">
        <OrderForm
          materials={materials.map((m) => ({ id: m.id, name: m.name, imageKey: m.imageKey }))}
        />
      </main>
    </div>
  );
}
