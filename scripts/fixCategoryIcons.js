#!/usr/bin/env node
import { models, sequelize } from '../config/database.js';

const { Category } = models;

async function fix() {
  await sequelize.authenticate();

  const cats = await Category.findAll({ order: [['id', 'ASC']] });
  for (const c of cats) {
    if (!c.icon) {
      console.log(`Skip ${c.id} ${c.name} (no icon)`);
      continue;
    }

    const raw = c.icon;
    const fixed = Buffer.from(raw, 'latin1').toString('utf8');

    if (fixed !== raw) {
      c.icon = fixed;
      await c.save();
      console.log(`Fixed ${c.id} ${c.name}: ${raw} -> ${fixed}`);
    } else {
      console.log(`No change for ${c.id} ${c.name}`);
    }
  }

  process.exit(0);
}

fix().catch((err) => {
  console.error('Error fixing icons:', err);
  process.exit(1);
});
