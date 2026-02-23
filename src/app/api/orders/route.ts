import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { purchaseOrderSchema } from "@/lib/validators";
import { normalizeMtTeam } from "@/lib/normalize";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = purchaseOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const mtTeamNorm = normalizeMtTeam(data.mtTeam);
  const itemsWithQty = data.items.filter((i) => i.qty > 0);

  // Snapshot current material prices
  const materialIds = itemsWithQty.map((i) => i.materialId);
  const materials = await prisma.material.findMany({
    where: { id: { in: materialIds } },
    select: { id: true, unitPrice: true },
  });
  const priceMap = new Map(materials.map((m) => [m.id, m.unitPrice]));

  try {
    // Get next order number
    const lastOrder = await prisma.purchaseOrder.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        mtTeamRaw: data.mtTeam,
        mtTeamNorm,
        workerName: data.workerName.trim(),
        comment: data.comment?.trim() || null,
        priority: data.priority,
        items: {
          create: itemsWithQty.map((item) => ({
            materialId: item.materialId,
            qty: item.qty,
            unitPrice: priceMap.get(item.materialId) ?? 0,
          })),
        },
      },
    });

    return NextResponse.json(
      { id: order.id, orderNumber: order.orderNumber },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Bestellung", detail: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Support countOnly for sidebar badge
  const countOnly = searchParams.get("countOnly");
  if (countOnly === "true") {
    const status = searchParams.get("status") || "NEW";
    const count = await prisma.purchaseOrder.count({
      where: { status },
    });
    return NextResponse.json({ count });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const mtTeam = searchParams.get("mtTeam");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const where: Record<string, unknown> = {};

  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, unknown>).lte = toDate;
    }
  }
  if (mtTeam) where.mtTeamNorm = { contains: mtTeam.toUpperCase(), mode: "insensitive" };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        items: { include: { material: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  // Lookup branch addresses for all teams in results
  const teamNorms = [...new Set(orders.map((o) => o.mtTeamNorm))];
  const teamSettings = teamNorms.length > 0
    ? await prisma.teamSettings.findMany({
        where: { mtTeamNorm: { in: teamNorms } },
      })
    : [];
  const branchMap = new Map(teamSettings.map((s) => [s.mtTeamNorm, s.branchAddress]));

  const ordersWithBranch = orders.map((o) =>
    Object.assign({}, JSON.parse(JSON.stringify(o)), {
      branchAddress: branchMap.get(o.mtTeamNorm) || "",
    })
  );

  return NextResponse.json({
    data: ordersWithBranch,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  });
}
