import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (search) {
    where.dehpNumber = { contains: search, mode: "insensitive" };
  }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      items: { include: { material: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by DEHP number
  const groupMap = new Map<
    string,
    {
      dehpNumber: string;
      totalQty: number;
      submissionCount: number;
      mtTeams: Set<string>;
      lastDate: Date;
    }
  >();

  for (const sub of submissions) {
    const key = sub.dehpNumber;
    const existing = groupMap.get(key);
    const qty = sub.items.reduce((sum, item) => sum + item.qty, 0);

    if (existing) {
      existing.totalQty += qty;
      existing.submissionCount++;
      existing.mtTeams.add(sub.mtTeamNorm);
      if (sub.createdAt > existing.lastDate) existing.lastDate = sub.createdAt;
    } else {
      groupMap.set(key, {
        dehpNumber: key,
        totalQty: qty,
        submissionCount: 1,
        mtTeams: new Set([sub.mtTeamNorm]),
        lastDate: sub.createdAt,
      });
    }
  }

  const allObjects = Array.from(groupMap.values())
    .sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime())
    .map((obj) => ({
      ...obj,
      mtTeams: Array.from(obj.mtTeams),
    }));

  // Check duplicates
  const dehpNumbers = allObjects.map((o) => o.dehpNumber);
  const duplicates = await prisma.notification.findMany({
    where: {
      dehpNumber: { in: dehpNumbers },
      type: "DEHP_DUPLICATE",
    },
    select: { dehpNumber: true },
  });
  const duplicateSet = new Set(duplicates.map((d) => d.dehpNumber));

  const total = allObjects.length;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paged = allObjects.slice(start, start + ITEMS_PER_PAGE).map((obj) => ({
    ...obj,
    isDuplicate: duplicateSet.has(obj.dehpNumber),
  }));

  return NextResponse.json({
    data: paged,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  });
}
