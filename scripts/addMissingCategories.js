#!/usr/bin/env node
import { models, sequelize } from '../config/database.js';

const { Category } = models;

const missing = [
  { name: 'Local Services', icon: '🛠️' },
  { name: 'Pet Services', icon: '🐾' },
  { name: 'Consultancy', icon: '📑' },
];

async function run() {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const m of missing) {
    const lower = m.name.toLowerCase();
    const found = await Category.findOne({
      where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), lower),
    });
    if (found) {
      console.log(`Already exists: ${found.id} ${found.name}`);
      if (!found.icon || found.icon !== m.icon) {
        found.icon = m.icon;
        await found.save();
        console.log(`Updated icon for ${found.name}`);
      }
    } else {
      const created = await Category.create(m);
      console.log(`Created: ${created.id} ${created.name}`);
    }
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Error adding missing categories:', err);
  process.exit(1);
});
