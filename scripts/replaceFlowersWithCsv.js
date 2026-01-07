#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { models, sequelize } from '../config/database.js';
import { Op, where, fn, col } from 'sequelize';
import { parse } from 'csv-parse/sync';

function parseCsv(content) {
  // Use csv-parse to robustly handle quoted fields and commas
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records;
}

function normalizeVariety(rawVar, title) {
  const v = (rawVar || '').toString().trim();
  const lower = v.toLowerCase();
  const t = (title || '').toString().toLowerCase();

  const mapCheck = (s) => lower.includes(s) || t.includes(s);

  if (!v && !t) return null;
  // Match specific flower types first so they aren't captured as 'Unbound'
  if (mapCheck('garland') || mapCheck('garla')) return 'Garlands';
  if (mapCheck('rose')) return 'Roses';
  if (mapCheck('jasmine')) return 'Jasmine';
  if (mapCheck('marigold')) return 'Marigold';
  if (mapCheck('lily')) return 'Lily';
  if (mapCheck('lotus')) return 'Lotus';
  if (mapCheck('tulasi')) return 'Tulasi';
  if (mapCheck('bound')) return 'Bound';
  if (mapCheck('unbound')) return 'Unbound';

  // Fallback: use cleaned rawVar if present
  if (v) return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();

  return null;
}
async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), 'data', 'flowers.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(content);
  if (!rows.length) {
    console.error('No rows in CSV');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();

    const { Product, Category } = models;

    // Find Flowers category
    const flowers = await Category.findOne({ where: { name: 'Flowers' } }) || await Category.findOne({ where: where(fn('lower', col('name')), 'flowers') });
    if (!flowers) {
      console.error('Flowers category not found. Seed categories first.');
      process.exit(1);
    }

    // Delete demo products (seeded samples)
    const delCount = await Product.destroy({ where: { title: { [Op.like]: 'Sample Product%'} } });
    console.log(`Deleted ${delCount} demo product(s)`);

    // Also delete existing products in Flowers to avoid duplicates
    const deleteFlowers = await Product.destroy({ where: { CategoryId: flowers.id } });
    console.log(`Deleted ${deleteFlowers} existing product(s) from Flowers`);

    // Prepare insert rows mapped to Flowers category id
    const toInsert = rows.map(r => {
      const title = (r.title || '').trim();
      const variety = normalizeVariety(r.variety, title);
      return {
        title,
        variety: variety || null,
        subVariety: (r.subVariety || null),
        price: Number(r.price) || 0,
        unit: r.unit || null,
        description: r.description || null,
        isService: true,
        deliveryAvailable: true,
        CategoryId: flowers.id,
        status: 'approved',
      };
    }).filter(r => r.title);

    if (!toInsert.length) {
      console.error('No valid products parsed from CSV');
      process.exit(1);
    }

    await Product.bulkCreate(toInsert);
    console.log(`Inserted ${toInsert.length} products into Flowers (CategoryId=${flowers.id})`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
