import { models, sequelize } from "../config/database.js";

const { Category, Product } = models;

async function ensureCategories() {
  const desired = [
    { name: "Crackers", icon: "🎆" },
    { name: "Flowers", icon: "🌸" },
    { name: "Groceries", icon: "🛒" },
    { name: "Local Services", icon: "🏬" },
    { name: "Pet Services", icon: "🐶" },
    { name: "Consultancy", icon: "💼" }
  ];

  const count = await Category.count();
  if (count > 0) {
    console.log(`Categories present: ${count}, skipping seeding categories.`);
    return;
  }

  console.log("Seeding default categories...");
  for (const c of desired) {
    try {
      await Category.create(c);
      console.log(`  - created category ${c.name}`);
    } catch (e) {
      console.error("Failed to create category", c.name, e && e.message ? e.message : e);
    }
  }
}

async function ensureProducts() {
  const pcount = await Product.count();
  if (pcount > 0) {
    console.log(`Products present: ${pcount}, skipping product seeding.`);
    return;
  }

  console.log("Seeding sample products (1 per category)...");
  const categories = await Category.findAll();
  for (const cat of categories) {
    try {
      await Product.create({
        title: `Sample ${cat.name} Item`,
        description: `Auto-seeded sample product for ${cat.name}`,
        price: 199,
        status: "approved",
        CategoryId: cat.id
      });
      console.log(`  - product for ${cat.name}`);
    } catch (e) {
      console.error(`Failed to create product for ${cat.name}`, e && e.message ? e.message : e);
    }
  }
}

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureCategories();
    await ensureProducts();
    console.log("Auto-seed complete.");
  } catch (err) {
    console.error("Auto-seed error:", err && err.message ? err.message : err);
  }
}

// Run when executed directly (ES module friendly)
run().then(() => process.exit(0)).catch(() => process.exit(1));

export default run;
