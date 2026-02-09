import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ team: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { team } = await params;
  const mtTeamNorm = decodeURIComponent(team).toUpperCase();

  const submissions = await prisma.submission.findMany({
    where: { mtTeamNorm },
    include: {
      items: { include: { material: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by DEHP for this team
  const objectMap = new Map<
    string,
    {
      dehpNumber: string;
      totalQty: number;
      submissions: typeof submissions;
    }
  >();

  for (const sub of submissions) {
    const key = sub.dehpNumber;
    const existing = objectMap.get(key);
    if (existing) {
      existing.totalQty += sub.items.reduce((sum, i) => sum + i.qty, 0);
      existing.submissions.push(sub);
    } else {
      objectMap.set(key, {
        dehpNumber: key,
        totalQty: sub.items.reduce((sum, i) => sum + i.qty, 0),
        submissions: [sub],
      });
    }
  }

  // Build material pivot for entire team
  const materialTotals = new Map<string, number>();
  for (const sub of submissions) {
    for (const item of sub.items) {
      const name = item.material.name;
      materialTotals.set(name, (materialTotals.get(name) || 0) + item.qty);
    }
  }

  const materialPivot = Array.from(materialTotals.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    mtTeamNorm,
    objects: Array.from(objectMap.values()),
    materialPivot,
    totalSubmissions: submissions.length,
    totalQty: materialPivot.reduce((sum, p) => sum + p.qty, 0),
  });
}
