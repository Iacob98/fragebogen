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
      totalCost: number;
      submissions: typeof submissions;
    }
  >();

  for (const sub of submissions) {
    const key = sub.dehpNumber;
    const existing = objectMap.get(key);
    const qty = sub.items.reduce((sum, i) => sum + i.qty, 0);
    const cost = sub.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    if (existing) {
      existing.totalQty += qty;
      existing.totalCost += cost;
      existing.submissions.push(sub);
    } else {
      objectMap.set(key, {
        dehpNumber: key,
        totalQty: qty,
        totalCost: cost,
        submissions: [sub],
      });
    }
  }

  // Build material pivot for entire team
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

  const materialPivot = Array.from(materialTotals.entries())
    .map(([name, { qty, cost }]) => ({ name, qty, cost }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalCost = materialPivot.reduce((sum, p) => sum + p.cost, 0);

  const settings = await prisma.teamSettings.findUnique({
    where: { mtTeamNorm },
  });

  return NextResponse.json({
    mtTeamNorm,
    branchAddress: settings?.branchAddress || "",
    objects: Array.from(objectMap.values()),
    materialPivot,
    totalSubmissions: submissions.length,
    totalQty: materialPivot.reduce((sum, p) => sum + p.qty, 0),
    totalCost,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ team: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { team } = await params;
  const mtTeamNorm = decodeURIComponent(team).toUpperCase();
  const body = await request.json();
  const { branchAddress } = body;

  if (typeof branchAddress !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const settings = await prisma.teamSettings.upsert({
    where: { mtTeamNorm },
    create: { mtTeamNorm, branchAddress: branchAddress.trim() },
    update: { branchAddress: branchAddress.trim() },
  });

  return NextResponse.json(settings);
}
