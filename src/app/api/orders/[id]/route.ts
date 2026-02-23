import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { orderStatusUpdateSchema } from "@/lib/validators";
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: { include: { material: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settings = await prisma.teamSettings.findUnique({
    where: { mtTeamNorm: order.mtTeamNorm },
  });

  return NextResponse.json(
    Object.assign({}, JSON.parse(JSON.stringify(order)), {
      branchAddress: settings?.branchAddress || "",
    })
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = orderStatusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentStatus = order.status as OrderStatus;
  const newStatus = parsed.data.status;
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    return NextResponse.json(
      { error: `Ungültiger Statusübergang: ${currentStatus} → ${newStatus}` },
      { status: 400 }
    );
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: newStatus,
      supplier: parsed.data.supplier ?? order.supplier,
      statusNote: parsed.data.statusNote ?? order.statusNote,
    },
    include: {
      items: { include: { material: true } },
    },
  });

  return NextResponse.json(updated);
}
