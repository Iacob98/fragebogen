import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // "open" | "closed" | null (all)
  const countOnly = searchParams.get("countOnly") === "true";

  const where: Record<string, unknown> = {};
  if (status === "open") where.isClosed = false;
  if (status === "closed") where.isClosed = true;

  if (countOnly) {
    const count = await prisma.notification.count({ where });
    return NextResponse.json({ count });
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { firstTriggeredAt: "desc" },
  });

  return NextResponse.json({ data: notifications });
}
