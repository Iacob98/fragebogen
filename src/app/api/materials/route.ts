import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name ist erforderlich" },
      { status: 400 }
    );
  }

  const material = await prisma.material.create({
    data: { name: name.trim() },
  });

  return NextResponse.json(material, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, active } = body;

  if (typeof id !== "number" || typeof active !== "boolean") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const material = await prisma.material.update({
    where: { id },
    data: { active },
  });

  return NextResponse.json(material);
}
