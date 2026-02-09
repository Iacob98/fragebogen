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
    where.mtTeamNorm = { contains: search.toUpperCase(), mode: "insensitive" };
  }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      items: true,
    },
  });

  // Group by normalized MT team
  const groupMap = new Map<
    string,
    {
      mtTeamNorm: string;
      totalQty: number;
      objectCount: Set<string>;
      submissionCount: number;
    }
  >();

  for (const sub of submissions) {
    const key = sub.mtTeamNorm;
    const existing = groupMap.get(key);
    const qty = sub.items.reduce((sum, item) => sum + item.qty, 0);

    if (existing) {
      existing.totalQty += qty;
      existing.submissionCount++;
      existing.objectCount.add(sub.dehpNumber);
    } else {
      groupMap.set(key, {
        mtTeamNorm: key,
        totalQty: qty,
        objectCount: new Set([sub.dehpNumber]),
        submissionCount: 1,
      });
    }
  }

  const allTeams = Array.from(groupMap.values())
    .map((t) => ({
      mtTeamNorm: t.mtTeamNorm,
      totalQty: t.totalQty,
      objectCount: t.objectCount.size,
      submissionCount: t.submissionCount,
    }))
    .sort((a, b) => a.mtTeamNorm.localeCompare(b.mtTeamNorm));

  const total = allTeams.length;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paged = allTeams.slice(start, start + ITEMS_PER_PAGE);

  return NextResponse.json({
    data: paged,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  });
}
