#!/usr/bin/env node
import { models, sequelize } from '../config/database.js';

async function main() {
  try {
    await sequelize.authenticate();

    const { Product } = models;

    const products = await Product.findAll({ order: [['id', 'ASC']] });

    const map = new Map();

    products.forEach(p => {
      const title = (p.title || '').toString().trim().toLowerCase();
      if (!title) return;
      if (!map.has(title)) map.set(title, []);
      map.get(title).push(p.toJSON());
    });

    let totalGroups = 0;
    let totalRemoved = 0;

    for (const [title, items] of map.entries()) {
      if (items.length <= 1) continue;
      totalGroups++;

      // Prefer item that already has CategoryId set; otherwise keep highest id
      let keeper = items.find(i => i.CategoryId) || items[items.length - 1];
      const keeperId = keeper.id;

      const idsToDelete = items.map(i => i.id).filter(id => id !== keeperId);

      if (idsToDelete.length) {
        const deleted = await Product.destroy({ where: { id: idsToDelete } });
        totalRemoved += deleted;
        console.log(`Title: "${title}" — kept id=${keeperId}, removed ${deleted} rows`);
      }
    }

    console.log(`Done. Groups with duplicates: ${totalGroups}. Rows removed: ${totalRemoved}`);
    process.exit(0);
  } catch (err) {
    console.error('Dedupe error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
