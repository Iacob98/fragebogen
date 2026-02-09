import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      items: { include: { material: true } },
      attachments: true,
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dupNotif = await prisma.notification.findFirst({
    where: {
      dehpNumber: submission.dehpNumber,
      type: "DEHP_DUPLICATE",
    },
  });

  return NextResponse.json({
    ...submission,
    isDuplicate: !!dupNotif,
  });
}
