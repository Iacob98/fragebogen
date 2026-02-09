import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
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

    const now = new Date();
    const dateDir = format(now, "yyyy/MM/dd");
    const uniqueName = `${uuidv4()}-${file.name}`;
    const storageKey = `${dateDir}/${uniqueName}`;
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
    const fullDir = path.join(uploadDir, dateDir);

    await mkdir(fullDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(fullDir, uniqueName), buffer);

    const attachment = await prisma.attachment.create({
      data: {
        storageKey,
        filename: file.name,
        mime: file.type,
        size: file.size,
      },
    });

    return NextResponse.json({
      id: attachment.id,
      filename: attachment.filename,
      size: attachment.size,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Upload fehlgeschlagen" },
      { status: 500 }
    );
  }
}
