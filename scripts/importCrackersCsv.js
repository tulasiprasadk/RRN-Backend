#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { models, sequelize } from '../config/database.js';
import { Op, where, fn, col } from 'sequelize';
import { parse } from 'csv-parse/sync';

function parseCsv(content) {
  return parse(content, { columns: true, skip_empty_lines: true, trim: true, relax_quotes: true, relax_column_count: true });
}

function titleCase(s) {
  return (s || '').toString().trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), 'data', 'crackers.csv');
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

    const crackers = await Category.findOne({ where: { name: 'Crackers' } }) || await Category.findOne({ where: where(fn('lower', col('name')), 'crackers') });
    if (!crackers) {
      console.error('Crackers category not found. Seed categories first.');
      process.exit(1);
    }

    // Remove existing crackers products to avoid duplicates
    const deleted = await Product.destroy({ where: { CategoryId: crackers.id } });
    console.log(`Deleted ${deleted} existing product(s) from Crackers`);

    const toInsert = rows.map(r => ({
      title: (r.title || r['title'] || '').toString().trim(),
      variety: titleCase(r.variety || r['variety'] || ''),
      subVariety: r.subVariety || r['subVariety'] || null,
      price: Number(r.price || r['price']) || 0,
      unit: r.unit || r['unit'] || null,
      description: r.description || r['description'] || null,
      CategoryId: crackers.id,
      status: 'approved',
      isService: false,
      deliveryAvailable: false
    })).filter(p => p.title);

    if (!toInsert.length) {
      console.error('No valid cracker products parsed');
      process.exit(1);
    }

    await Product.bulkCreate(toInsert);
    console.log(`Inserted ${toInsert.length} Crackers products.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
