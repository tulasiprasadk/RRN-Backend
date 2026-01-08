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

    // Ensure Postgres sequences are synced to avoid duplicate-key on inserts
    try {
      await dest.query(`SELECT setval(pg_get_serial_sequence('"Categories"','id'), COALESCE((SELECT MAX(id) FROM "Categories"), 1));`);
      await dest.query(`SELECT setval(pg_get_serial_sequence('"Products"','id'), COALESCE((SELECT MAX(id) FROM "Products"), 1));`);
      console.log('Postgres sequences synced for Categories and Products');
    } catch (seqErr) {
      console.warn('Failed to sync sequences:', seqErr && seqErr.message ? seqErr.message : seqErr);
    }
    // Log check constraints on Products to help diagnose constraint violations during inserts
    try {
      const [cons] = await dest.query(`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = '"Products"'::regclass AND contype = 'c';`);
      console.log('Products table check constraints:', cons.map(c => ({ name: c.conname, def: c.def })));
    } catch (cErr) {
      console.warn('Could not retrieve Products constraints:', cErr && cErr.message ? cErr.message : cErr);
    }

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
        try {
          destCat = await destModels.Category.create({ name: c.name, icon: c.icon || null });
          console.log(`Created category '${c.name}' -> id=${destCat.id}`);
        } catch (err) {
          // Handle duplicate-key race/sequence issues by attempting to locate the existing row
          const code = err && (err.parent && err.parent.code || err.original && err.original.code);
          console.error('Category.create failed:', err && err.message ? err.message : err)
          if (code === '23505') {
            console.warn(`Duplicate key detected when creating category '${c.name}'. Attempting to reuse existing row.`);
            destCat = await destModels.Category.findOne({ where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), (c.name || '').toLowerCase()) });
            if (destCat) {
              console.log(`Reusing category after duplicate key: '${c.name}' -> id=${destCat.id}`);
            } else {
              console.error('Duplicate key but could not find existing category by name; rethrowing.');
              throw err;
            }
          } else {
            console.error('Error keys:', Object.getOwnPropertyNames(err))
            if (err.parent) console.error('parent:', err.parent)
            if (err.original) console.error('original:', err.original)
            if (err.sql) console.error('sql:', err.sql)
            throw err
          }
        }
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
      try {
        // Normalize status to satisfy destination check constraint
        let statusVal = (obj.status || 'pending').toString().toLowerCase();
        const statusMap = { approved: 'active', active: 'active', pending: 'pending', inactive: 'inactive' };
        const normalizedStatus = statusMap[statusVal] || 'pending';

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
          status: normalizedStatus,
          CategoryId: destCategoryId,
        });
        created++;
      } catch (err) {
        console.error(`Product.create failed for title='${obj.title}' CategoryId=${destCategoryId}:`, err && err.message ? err.message : err);
        if (err && (err.parent || err.original)) {
          console.error('Error details:', err.parent || err.original);
        }
        // If duplicate key, attempt to find existing product and skip
        const code = err && (err.parent && err.parent.code || err.original && err.original.code);
        if (code === '23505') {
          console.warn(`Duplicate product detected for title='${obj.title}'. Attempting to find existing row and skip.`);
          const existing = await destModels.Product.findOne({ where: { title: obj.title, CategoryId: destCategoryId } });
          if (existing) {
            skipped++;
            continue;
          }
        }
        throw err;
      }
    }

    console.log(`Migration complete. created=${created} skipped=${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
