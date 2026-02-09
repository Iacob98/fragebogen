import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const materials = [
  "Isolierschale 18", "Isolierschale 22", "Isolierschale 28", "Isolierschale 35",
  "Rohrschelle 18", "Rohrschelle 22", "Rohrschelle 28", "Rohrschelle 35",
  "Bogen 90° 18", "Bogen 90° 22", "Bogen 90° 28",
  "T-Stück 18", "T-Stück 22", "Übergang 18-22",
  "Alpex Rohr 16x2 (m)", "Alpex Rohr 20x2 (m)",
];

try {
  for (const name of materials) {
    await pool.query(
      `INSERT INTO materials (name, active) VALUES ($1, true) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }
  console.log(`Seeded ${materials.length} materials`);

  const hash = await bcrypt.hash("admin123", 10);
  await pool.query(
    `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
    ["admin", hash]
  );
  console.log("Seeded admin user (admin / admin123)");
} catch (err) {
  console.error("Seed error:", err.message);
} finally {
  await pool.end();
}
