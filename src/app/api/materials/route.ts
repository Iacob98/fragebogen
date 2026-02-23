import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  const where = all ? {} : { active: true };
  const materials = await prisma.material.findMany({
    where,
    orderBy: { id: "asc" },
  });
  return NextResponse.json(materials);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, unitPrice, articleNumber } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name ist erforderlich" },
      { status: 400 }
    );
  }

  const material = await prisma.material.create({
    data: {
      name: name.trim(),
      unitPrice: typeof unitPrice === "number" ? unitPrice : 0,
      articleNumber: typeof articleNumber === "string" ? articleNumber.trim() || null : null,
    },
  });

  return NextResponse.json(material, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, active, unitPrice, name, articleNumber } = body;

  if (typeof id !== "number") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof active === "boolean") data.active = active;
  if (typeof unitPrice === "number") data.unitPrice = unitPrice;
  if (typeof name === "string") {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "Name darf nicht leer sein" },
        { status: 400 }
      );
    }
    data.name = trimmed;
  }
  if (typeof articleNumber === "string") {
    data.articleNumber = articleNumber.trim() || null;
  }

  try {
    const material = await prisma.material.update({
      where: { id },
      data,
    });
    return NextResponse.json(material);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ein Material mit diesem Namen existiert bereits" },
        { status: 409 }
      );
    }
    throw err;
  }
}
