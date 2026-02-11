import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, PHOTO_CATEGORY_KEYS } from "@/lib/constants";

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 80;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    if (category && !PHOTO_CATEGORY_KEYS.includes(category as never)) {
      return NextResponse.json(
        { error: "Ungültige Kategorie" },
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

    const now = new Date();
    const dateDir = format(now, "yyyy/MM/dd");
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const uniqueName = `${uuidv4()}-${baseName}.webp`;
    const storageKey = `${dateDir}/${uniqueName}`;
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
    const fullDir = path.join(uploadDir, dateDir);

    await mkdir(fullDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const compressed = await sharp(Buffer.from(bytes))
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    await writeFile(path.join(fullDir, uniqueName), compressed);

    const attachment = await prisma.attachment.create({
      data: {
        storageKey,
        filename: `${baseName}.webp`,
        mime: "image/webp",
        size: compressed.length,
        category: category || null,
      },
    });

    return NextResponse.json({
      id: attachment.id,
      filename: attachment.filename,
      size: attachment.size,
      category: attachment.category,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Upload fehlgeschlagen" },
      { status: 500 }
    );
  }
}
