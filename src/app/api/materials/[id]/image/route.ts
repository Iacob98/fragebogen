import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/constants";

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 80;

function getUploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || "uploads");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const materialId = parseInt(id, 10);
  if (isNaN(materialId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { imageKey: true },
  });

  if (!material?.imageKey) {
    return NextResponse.json({ error: "No image" }, { status: 404 });
  }

  const filePath = path.join(getUploadDir(), material.imageKey);

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const materialId = parseInt(id, 10);
  if (isNaN(materialId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  if (!material) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "Keine Datei hochgeladen" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Dateityp nicht erlaubt" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Datei zu groß (max. 10MB)" },
      { status: 400 }
    );
  }

  const uploadDir = getUploadDir();

  // Delete old image if exists
  if (material.imageKey) {
    try {
      await unlink(path.join(uploadDir, material.imageKey));
    } catch {
      // Old file may already be gone
    }
  }

  const now = new Date();
  const dateDir = format(now, "yyyy/MM/dd");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const uniqueName = `${uuidv4()}-${baseName}.webp`;
  const storageKey = `${dateDir}/${uniqueName}`;
  const fullDir = path.join(uploadDir, dateDir);

  await mkdir(fullDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const compressed = await sharp(Buffer.from(bytes))
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  await writeFile(path.join(fullDir, uniqueName), compressed);

  await prisma.material.update({
    where: { id: materialId },
    data: { imageKey: storageKey },
  });

  return NextResponse.json({ imageKey: storageKey });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const materialId = parseInt(id, 10);
  if (isNaN(materialId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { imageKey: true },
  });

  if (!material?.imageKey) {
    return NextResponse.json({ error: "No image" }, { status: 404 });
  }

  try {
    await unlink(path.join(getUploadDir(), material.imageKey));
  } catch {
    // File may already be gone
  }

  await prisma.material.update({
    where: { id: materialId },
    data: { imageKey: null },
  });

  return NextResponse.json({ ok: true });
}
