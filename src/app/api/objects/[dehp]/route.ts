import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dehp: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dehp } = await params;
  const dehpNumber = decodeURIComponent(dehp);

  const submissions = await prisma.submission.findMany({
    where: { dehpNumber },
    include: {
      items: { include: { material: true } },
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Build material pivot
  const materialTotals = new Map<string, { qty: number; cost: number }>();
  for (const sub of submissions) {
    for (const item of sub.items) {
      const name = item.material.name;
      const existing = materialTotals.get(name) || { qty: 0, cost: 0 };
      existing.qty += item.qty;
      existing.cost += item.qty * item.unitPrice;
      materialTotals.set(name, existing);
    }
  }

  const pivot = Array.from(materialTotals.entries())
    .map(([name, { qty, cost }]) => ({ name, qty, cost }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalCost = pivot.reduce((sum, p) => sum + p.cost, 0);

  return NextResponse.json({
    dehpNumber,
    submissions,
    materialPivot: pivot,
    totalQty: pivot.reduce((sum, p) => sum + p.qty, 0),
    totalCost,
  });
}
