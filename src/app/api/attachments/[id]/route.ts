import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
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
  const attachmentId = parseInt(id);

  if (isNaN(attachmentId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
  const filePath = path.join(uploadDir, attachment.storageKey);

  try {
    const buffer = await readFile(filePath);
    const encodedFilename = encodeURIComponent(attachment.filename);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mime,
        "Content-Disposition": `inline; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    console.error(`[attachments] File not found: ${filePath}`, err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
