import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const materials = [
  "Isolierschale 18",
  "Isolierschale 22",
  "Isolierschale 28",
  "Isolierschale 35",
  "Rohrschelle 18",
  "Rohrschelle 22",
  "Rohrschelle 28",
  "Rohrschelle 35",
  "Bogen 90° 18",
  "Bogen 90° 22",
  "Bogen 90° 28",
  "T-Stück 18",
  "T-Stück 22",
  "Übergang 18-22",
  "Alpex Rohr 16x2 (m)",
  "Alpex Rohr 20x2 (m)",
];

async function main() {
  // Seed materials
  for (const name of materials) {
    await prisma.material.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${materials.length} materials`);

  // Seed admin user
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: { passwordHash: hash },
    create: { username: "admin", passwordHash: hash },
  });
  console.log("Seeded admin user (admin / admin123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
