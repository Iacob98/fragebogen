import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateCsv } from "@/lib/csv";
import { exportParamsSchema } from "@/lib/validators";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = exportParamsSchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const { type, from, to, mtTeam, dehpNumber } = parsed.data;

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
  if (dehpNumber) where.dehpNumber = { contains: dehpNumber, mode: "insensitive" };

  let csv: string;
  let filename: string;

  switch (type) {
    case "submissions": {
      const submissions = await prisma.submission.findMany({
        where,
        include: { items: { include: { material: true } } },
        orderBy: { createdAt: "desc" },
      });

      const rows: Record<string, unknown>[] = [];
      for (const sub of submissions) {
        for (const item of sub.items) {
          rows.push({
            Datum: format(sub.createdAt, "dd.MM.yyyy HH:mm"),
            "MT Team": sub.mtTeamNorm,
            "DEHP Nummer": sub.dehpNumber,
            Vorname: sub.firstName,
            Nachname: sub.lastName,
            Material: item.material.name,
            Menge: item.qty,
            Kommentar: sub.comment || "",
          });
        }
      }
      csv = generateCsv(rows);
      filename = `meldungen_${format(new Date(), "yyyy-MM-dd")}.csv`;
      break;
    }

    case "object": {
      const submissions = await prisma.submission.findMany({
        where,
        include: { items: { include: { material: true } } },
        orderBy: { createdAt: "desc" },
      });

      const pivotMap = new Map<string, Map<string, number>>();
      const allMaterials = new Set<string>();

      for (const sub of submissions) {
        const dehp = sub.dehpNumber;
        if (!pivotMap.has(dehp)) pivotMap.set(dehp, new Map());
        for (const item of sub.items) {
          const name = item.material.name;
          allMaterials.add(name);
          const m = pivotMap.get(dehp)!;
          m.set(name, (m.get(name) || 0) + item.qty);
        }
      }

      const materialList = Array.from(allMaterials).sort();
      const rows: Record<string, unknown>[] = [];

      for (const [dehp, materials] of pivotMap) {
        const row: Record<string, unknown> = { "DEHP Nummer": dehp };
        for (const mat of materialList) {
          row[mat] = materials.get(mat) || 0;
        }
        row["Gesamt"] = Array.from(materials.values()).reduce((a, b) => a + b, 0);
        rows.push(row);
      }

      csv = generateCsv(rows);
      filename = `objekte_${format(new Date(), "yyyy-MM-dd")}.csv`;
      break;
    }

    case "team": {
      const submissions = await prisma.submission.findMany({
        where,
        include: { items: { include: { material: true } } },
        orderBy: { createdAt: "desc" },
      });

      const rows: Record<string, unknown>[] = [];
      for (const sub of submissions) {
        for (const item of sub.items) {
          rows.push({
            "MT Team": sub.mtTeamNorm,
            "DEHP Nummer": sub.dehpNumber,
            Datum: format(sub.createdAt, "dd.MM.yyyy HH:mm"),
            Material: item.material.name,
            Menge: item.qty,
            Vorname: sub.firstName,
            Nachname: sub.lastName,
          });
        }
      }

      csv = generateCsv(rows);
      filename = `teams_${format(new Date(), "yyyy-MM-dd")}.csv`;
      break;
    }

    case "report": {
      const submissions = await prisma.submission.findMany({
        where,
        include: { items: { include: { material: true } } },
      });

      const totals = new Map<string, number>();
      for (const sub of submissions) {
        for (const item of sub.items) {
          const name = item.material.name;
          totals.set(name, (totals.get(name) || 0) + item.qty);
        }
      }

      const rows = Array.from(totals.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, qty]) => ({
          Material: name,
          "Gesamtmenge": qty,
        }));

      csv = generateCsv(rows);
      filename = `bericht_${format(new Date(), "yyyy-MM-dd")}.csv`;
      break;
    }
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
