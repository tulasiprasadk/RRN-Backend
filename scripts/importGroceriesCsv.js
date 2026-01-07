#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { models, sequelize } from '../config/database.js';
import { Op, where, fn, col } from 'sequelize';
import { parse } from 'csv-parse/sync';

// Helper: find or create category by name (case-insensitive). Returns Category instance.
async function getOrCreateCategoryByName(Category, name) {
  const { fn, col } = await import('sequelize');
  const lowerName = (name || '').toString().trim().toLowerCase();

  if (!lowerName) return null;

  // Try to find existing category (case-insensitive), prefer lowest id
  const existing = await Category.findOne({ where: where(fn('lower', col('name')), lowerName), order: [['id', 'ASC']] });
  if (existing) return existing;

  // Not found — create a new category with given name
  try {
    const created = await Category.create({ name: name.trim() });
    return created;
  } catch (err) {
    // Race: another process may have created it — try finding again
    const retry = await Category.findOne({ where: where(fn('lower', col('name')), lowerName), order: [['id', 'ASC']] });
    return retry;
  }
}

function parseCsv(content) {
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

function titleCase(s) {
  return (s || '').toString().trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), 'data', 'groceries.csv');
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

    // Resolve or create Groceries category (case-insensitive)
    const groceriesCategory = await getOrCreateCategoryByName(Category, 'Groceries');
    if (!groceriesCategory) {
      console.error('Failed to resolve or create Groceries category.');
      process.exit(1);
    }

    // Remove existing groceries products to avoid duplicates
    const deleted = await Product.destroy({ where: { CategoryId: groceriesCategory.id } });
    console.log(`Deleted ${deleted} existing product(s) from Groceries`);

    const toInsert = rows.map(r => ({
      title: (r.title || r['title'] || '').toString().trim(),
      variety: titleCase(r.variety || r['variety'] || ''),
      subVariety: r.subVariety || r['subVariety'] || null,
      price: Number(r.price || r['price']) || 0,
      unit: r.unit || r['unit'] || null,
      description: r.description || r['description'] || null,
      CategoryId: groceriesCategory.id,
      status: 'approved',
      isService: false,
      deliveryAvailable: true
    })).filter(p => p.title);

    if (!toInsert.length) {
      console.error('No valid grocery products parsed');
      process.exit(1);
    }

    await Product.bulkCreate(toInsert);
    console.log(`Inserted ${toInsert.length} Groceries products.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
