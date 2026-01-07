#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { models, sequelize } from '../config/database.js';

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(l => {
    // naive split - assumes no commas in fields
    const parts = l.split(',').map(p => p.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = parts[i] || '');
    return obj;
  });
  return rows;
}

async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), '..', 'frontend', 'public', 'sample-products-upload.csv');
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
    // do not alter schema here

    const { Product, Category } = models;

    // Build category map
    const cats = await Category.findAll();
    const catMap = {};
    cats.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });

    const toInsert = [];
    const errors = [];

    rows.forEach((r, idx) => {
      const title = r.title || r.name || '';
      if (!title) { errors.push(`Row ${idx+1}: missing title`); return; }
      const price = Number(r.price) || 0;
      let categoryId = r.categoryId ? Number(r.categoryId) : null;
      if (!categoryId && r.categoryName) {
        const key = (r.categoryName || '').toLowerCase();
        categoryId = catMap[key] || null;
      }
      if (!categoryId) { errors.push(`Row ${idx+1}: missing/unknown category (${r.categoryName || r.categoryId})`); return; }

      toInsert.push({
        title: title.trim(),
        variety: r.variety || null,
        subVariety: r.subVariety || null,
        price,
        unit: r.unit || null,
        description: r.description || null,
        CategoryId: categoryId,
        status: 'approved'
      });
    });

    if (!toInsert.length) {
      console.error('No valid rows to insert. Errors:', errors);
      process.exit(1);
    }

    await Product.bulkCreate(toInsert);
    console.log(`Inserted ${toInsert.length} products. Errors: ${errors.length}`);
    if (errors.length) console.log(errors.join('\n'));
    process.exit(0);
  } catch (err) {
    console.error('Import error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
