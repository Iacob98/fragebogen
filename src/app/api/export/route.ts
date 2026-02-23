import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateCsv } from "@/lib/csv";
import { exportParamsSchema } from "@/lib/validators";
import { format } from "date-fns";
import { ORDER_STATUSES, ORDER_PRIORITIES, type OrderStatus, type OrderPriority } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/format";

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
            Adresse: sub.address || "",
            Material: item.material.name,
            Menge: item.qty,
            "Stückpreis": item.unitPrice,
            Kosten: item.qty * item.unitPrice,
            Kommentar: sub.comment || "",
            "Hat Radiator": sub.hasRadiator ? "Ja" : "Nein",
            "Fotos vollständig": sub.photoComplete ? "Ja" : "Nein",
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
      const costMap = new Map<string, number>();
      const allMaterials = new Set<string>();

      for (const sub of submissions) {
        const dehp = sub.dehpNumber;
        if (!pivotMap.has(dehp)) pivotMap.set(dehp, new Map());
        for (const item of sub.items) {
          const name = item.material.name;
          allMaterials.add(name);
          const m = pivotMap.get(dehp)!;
          m.set(name, (m.get(name) || 0) + item.qty);
          costMap.set(dehp, (costMap.get(dehp) || 0) + item.qty * item.unitPrice);
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
        row["Gesamtkosten"] = costMap.get(dehp) || 0;
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
            "Stückpreis": item.unitPrice,
            Kosten: item.qty * item.unitPrice,
            Vorname: sub.firstName,
            Nachname: sub.lastName,
            Adresse: sub.address || "",
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

      const totals = new Map<string, { qty: number; cost: number }>();
      for (const sub of submissions) {
        for (const item of sub.items) {
          const name = item.material.name;
          const existing = totals.get(name) || { qty: 0, cost: 0 };
          existing.qty += item.qty;
          existing.cost += item.qty * item.unitPrice;
          totals.set(name, existing);
        }
      }

      const rows = Array.from(totals.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, { qty, cost }]) => ({
          Material: name,
          "Gesamtmenge": qty,
          "Gesamtkosten": cost,
        }));

      csv = generateCsv(rows);
      filename = `bericht_${format(new Date(), "yyyy-MM-dd")}.csv`;
      break;
    }

    case "orders": {
      const orderWhere: Record<string, unknown> = {};
      if (from || to) {
        orderWhere.createdAt = {};
        if (from) (orderWhere.createdAt as Record<string, unknown>).gte = new Date(from);
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          (orderWhere.createdAt as Record<string, unknown>).lte = toDate;
        }
      }
      if (mtTeam) orderWhere.mtTeamNorm = { contains: mtTeam.toUpperCase(), mode: "insensitive" };

      const orders = await prisma.purchaseOrder.findMany({
        where: orderWhere,
        include: { items: { include: { material: true } } },
        orderBy: { createdAt: "desc" },
      });

      const rows: Record<string, unknown>[] = [];
      for (const order of orders) {
        for (const item of order.items) {
          rows.push({
            Nummer: formatOrderNumber(order.orderNumber),
            Datum: format(order.createdAt, "dd.MM.yyyy HH:mm"),
            "MT Team": order.mtTeamNorm,
            Name: order.workerName,
            Priorität: ORDER_PRIORITIES[order.priority as OrderPriority]?.label ?? order.priority,
            Status: ORDER_STATUSES[order.status as OrderStatus]?.label ?? order.status,
            Material: item.material.name,
            Menge: item.qty,
            Stückpreis: item.unitPrice,
            Kosten: item.qty * item.unitPrice,
            Lieferant: order.supplier || "",
            Kommentar: order.comment || "",
          });
        }
      }
      csv = generateCsv(rows);
      filename = `bestellungen_${format(new Date(), "yyyy-MM-dd")}.csv`;
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
