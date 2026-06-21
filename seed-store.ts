/**
 * Seed script for Minecraft server store plans and Pterodactyl settings.
 * Run with: npx ts-node seed-store.ts
 *
 * Inserts 4 Minecraft server plans into the shop_products table
 * and adds Pterodactyl panel configuration settings.
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, 'zyphron.db');

const shopProducts = [
  {
    type: 'server',
    currency_code: 'COINS',
    price: 500,
    quantity: -1, // unlimited
    display: 'Minecraft Basic',
    description: JSON.stringify({
      ram_mb: 1024,
      disk_mb: 10240,
      cpu_percent: 100,
      egg: 'paper',
      nest: 'minecraft',
    }),
    disabled: 0,
  },
  {
    type: 'server',
    currency_code: 'COINS',
    price: 1000,
    quantity: -1,
    display: 'Minecraft Standard',
    description: JSON.stringify({
      ram_mb: 2048,
      disk_mb: 20480,
      cpu_percent: 150,
      egg: 'paper',
      nest: 'minecraft',
    }),
    disabled: 0,
  },
  {
    type: 'server',
    currency_code: 'COINS',
    price: 2000,
    quantity: -1,
    display: 'Minecraft Premium',
    description: JSON.stringify({
      ram_mb: 4096,
      disk_mb: 40960,
      cpu_percent: 200,
      egg: 'paper',
      nest: 'minecraft',
    }),
    disabled: 0,
  },
  {
    type: 'server',
    currency_code: 'COINS',
    price: 4000,
    quantity: -1,
    display: 'Minecraft Ultimate',
    description: JSON.stringify({
      ram_mb: 8192,
      disk_mb: 81920,
      cpu_percent: 300,
      egg: 'paper',
      nest: 'minecraft',
    }),
    disabled: 0,
  },
];

// Pterodactyl panel configuration settings
// Update these placeholder values with your actual panel details
const pterodactylSettings = [
  { key: 'panel_node_id', value: '1', description: 'Node ID where servers are created' },
  { key: 'panel_egg_id', value: '1', description: 'Paper egg ID (update with your actual egg ID from panel)' },
  { key: 'panel_nest_id', value: '1', description: 'Minecraft nest ID (update with your actual nest ID from panel)' },
  { key: 'panel_docker_image', value: 'ghcr.io/pterodactyl/yolks:java_17', description: 'Docker image for Minecraft servers' },
];

async function main() {
  console.log('🎮 Minecraft Server Store Seed Script');
  console.log('=====================================\n');

  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create tables if they don't exist (in case this is run before the app starts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      currency_code TEXT DEFAULT 'INR',
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      description TEXT NOT NULL,
      display TEXT NOT NULL,
      disabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Check if shop products already exist
  const existingProducts = db.prepare('SELECT COUNT(*) as count FROM shop_products').get() as any;
  const existingCount = existingProducts?.count || 0;

  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing shop products.`);
    console.log('   Clearing existing products and re-seeding...\n');
    db.exec('DELETE FROM shop_products');
  }

  // Insert shop products
  const insertProduct = db.prepare(`
    INSERT INTO shop_products (type, currency_code, price, quantity, display, description, disabled)
    VALUES (@type, @currency_code, @price, @quantity, @display, @description, @disabled)
  `);

  const insertMany = db.transaction((products: typeof shopProducts) => {
    for (const product of products) {
      insertProduct.run(product);
    }
  });

  insertMany(shopProducts);
  console.log(`✅ Inserted ${shopProducts.length} Minecraft server plans:`);
  console.log('');
  for (const product of shopProducts) {
    const specs = JSON.parse(product.description);
    console.log(`   📦 ${product.display}`);
    console.log(`      💰 ${product.price} coins`);
    console.log(`      🧠 ${specs.ram_mb / 1024} GB RAM | 💾 ${specs.disk_mb / 1024} GB Disk | ⚡ ${specs.cpu_percent}% CPU`);
    console.log('');
  }

  // Insert Pterodactyl settings (upsert - don't overwrite existing values)
  console.log('⚙️  Pterodactyl Panel Settings:');
  console.log('');
  const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO NOTHING
  `);

  const upsertSettingDesc = db.prepare(`
    INSERT INTO settings (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET updated_at = datetime('now')
  `);

  for (const setting of pterodactylSettings) {
    // Use DO NOTHING to not overwrite existing settings
    const result = upsertSetting.run({ key: setting.key, value: setting.value });
    if (result.changes > 0) {
      console.log(`   ✅ ${setting.key} = ${setting.value} (${setting.description})`);
    } else {
      const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get(setting.key) as any;
      console.log(`   ⏭️  ${setting.key} = ${existing?.value} (already set, skipped)`);
    }
  }

  console.log('');
  console.log('=====================================');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 IMPORTANT: Update the following settings in the admin panel');
  console.log('   with your actual Pterodactyl panel values:');
  console.log('   - panel_node_id: Your node ID from the panel');
  console.log('   - panel_egg_id: The Paper egg ID from Minecraft nest');
  console.log('   - panel_nest_id: The Minecraft nest ID');
  console.log('');

  // Show all current settings
  const allSettings = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'panel_%' ORDER BY key").all() as any[];
  if (allSettings.length > 0) {
    console.log('📋 Current panel settings:');
    for (const s of allSettings) {
      console.log(`   ${s.key} = ${s.value}`);
    }
  }

  db.close();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
