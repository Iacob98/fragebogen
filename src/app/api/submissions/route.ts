import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submissionSchema } from "@/lib/validators";
import { normalizeMtTeam } from "@/lib/normalize";
import { checkAndCreateDuplicateNotification } from "@/lib/notifications";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = submissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const mtTeamNorm = normalizeMtTeam(data.mtTeam);
  const itemsWithQty = data.items.filter((i) => i.qty > 0);

  const submission = await prisma.$transaction(async (tx) => {
    const sub = await tx.submission.create({
      data: {
        mtTeamRaw: data.mtTeam,
        mtTeamNorm,
        dehpNumber: data.dehpNumber.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        comment: data.comment?.trim() || null,
        items: {
          create: itemsWithQty.map((item) => ({
            materialId: item.materialId,
            qty: item.qty,
          })),
        },
      },
    });

    if (data.attachmentIds && data.attachmentIds.length > 0) {
      await tx.attachment.updateMany({
        where: { id: { in: data.attachmentIds }, submissionId: null },
        data: { submissionId: sub.id },
      });
    }

    return sub;
  });

  await checkAndCreateDuplicateNotification(submission.dehpNumber);

  return NextResponse.json({ id: submission.id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const mtTeam = searchParams.get("mtTeam");
  const dehp = searchParams.get("dehp");
  const lastName = searchParams.get("lastName");

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
  if (dehp) where.dehpNumber = { contains: dehp, mode: "insensitive" };
  if (lastName) where.lastName = { contains: lastName, mode: "insensitive" };

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        items: { include: { material: true } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.submission.count({ where }),
  ]);

  // Check which submissions have duplicate DEHP
  const dehpNumbers = [...new Set(submissions.map((s) => s.dehpNumber))];
  const duplicates = await prisma.notification.findMany({
    where: {
      dehpNumber: { in: dehpNumbers },
      type: "DEHP_DUPLICATE",
    },
    select: { dehpNumber: true },
  });
  const duplicateSet = new Set(duplicates.map((d) => d.dehpNumber));

  const data = submissions.map((s) => ({
    ...s,
    isDuplicate: duplicateSet.has(s.dehpNumber),
  }));

  return NextResponse.json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  });
}
