import { Sequelize, Op } from 'sequelize';
import initModels from '../models/index.js';

async function main() {
  try {
    // Accept DATABASE_URL from env or first CLI argument
    const databaseUrl = process.env.DATABASE_URL || process.argv[2];
    if (!databaseUrl) {
      console.error('ERROR: Provide Postgres connection URL via DATABASE_URL env or as first argument.');
      console.error("Usage: node migrateSqliteToPostgres.js 'postgres://user:pass@host:5432/db'\n");
      process.exit(1);
    }

    const sqliteStorage = process.env.DB_STORAGE || './database.sqlite';

    // Source: local sqlite
    const src = new Sequelize({ dialect: 'sqlite', storage: sqliteStorage, logging: false });
    // Destination: Postgres
    const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
    const dest = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    });

    const srcModels = initModels(src);
    const destModels = initModels(dest);

    await src.authenticate();
    await dest.authenticate();
    console.log('Connected to both databases.');

    // Load source categories
    const srcCats = await srcModels.Category.findAll();
    console.log(`Source categories: ${srcCats.length}`);

    // Build mapping: srcCategoryId -> destCategoryId
    const catMap = {};

    for (const c of srcCats) {
      const name = (c.name || '').trim();
      if (!name) continue;

      // find existing dest category case-insensitively
      let destCat = await destModels.Category.findOne({
        where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), name.toLowerCase()),
      });

      if (!destCat) {
        destCat = await destModels.Category.create({ name: c.name, icon: c.icon || null });
        console.log(`Created category '${c.name}' -> id=${destCat.id}`);
      } else {
        console.log(`Reusing category '${c.name}' -> id=${destCat.id}`);
      }

      catMap[c.id] = destCat.id;
    }

    // Copy products
    const srcProducts = await srcModels.Product.findAll({ include: [{ model: srcModels.Category }] });
    console.log(`Source products: ${srcProducts.length}`);

    let created = 0;
    let skipped = 0;

    for (const p of srcProducts) {
      const obj = p.toJSON();

      // resolve destination CategoryId
      let destCategoryId = null;
      if (obj.CategoryId && catMap[obj.CategoryId]) destCategoryId = catMap[obj.CategoryId];
      else if (obj.Category && obj.Category.name) {
        const name = (obj.Category.name || '').trim();
        const found = await destModels.Category.findOne({ where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), name.toLowerCase()) });
        if (found) destCategoryId = found.id;
      }

      // If no category mapping, skip (safe)
      if (!destCategoryId) {
        console.warn(`Skipping product id=${obj.id} title='${obj.title}' (no category mapping)`);
        skipped++;
        continue;
      }

      // Check whether a product with same title + CategoryId already exists
      const exists = await destModels.Product.findOne({ where: { title: obj.title, CategoryId: destCategoryId } });
      if (exists) {
        skipped++;
        continue;
      }

      // Create product in destination
      await destModels.Product.create({
        title: obj.title,
        titleKannada: obj.titleKannada || null,
        description: obj.description || null,
        descriptionKannada: obj.descriptionKannada || null,
        price: obj.price || 0,
        variety: obj.variety || null,
        subVariety: obj.subVariety || null,
        unit: obj.unit || null,
        supplierId: obj.supplierId || null,
        isService: obj.isService === undefined ? false : obj.isService,
        deliveryAvailable: obj.deliveryAvailable === undefined ? true : obj.deliveryAvailable,
        isTemplate: obj.isTemplate === undefined ? false : obj.isTemplate,
        metadata: obj.metadata || null,
        status: obj.status || 'approved',
        CategoryId: destCategoryId,
      });

      created++;
    }

    console.log(`Migration complete. created=${created} skipped=${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
