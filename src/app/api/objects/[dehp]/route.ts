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
  const materialTotals = new Map<string, number>();
  for (const sub of submissions) {
    for (const item of sub.items) {
      const name = item.material.name;
      materialTotals.set(name, (materialTotals.get(name) || 0) + item.qty);
    }
  }

  const pivot = Array.from(materialTotals.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    dehpNumber,
    submissions,
    materialPivot: pivot,
    totalQty: pivot.reduce((sum, p) => sum + p.qty, 0),
  });
}
