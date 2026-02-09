import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notifId = parseInt(id);

  if (isNaN(notifId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json();

  const notification = await prisma.notification.update({
    where: { id: notifId },
    data: {
      isClosed: body.isClosed ?? true,
      closedAt: body.isClosed ? new Date() : null,
    },
  });

  return NextResponse.json(notification);
}
