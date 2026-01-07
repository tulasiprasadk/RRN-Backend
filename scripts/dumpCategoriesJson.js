#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { models, sequelize } from '../config/database.js';

const { Category } = models;

async function dump() {
  await sequelize.authenticate();
  const cats = await Category.findAll({ order: [['id', 'ASC']] });
  const out = cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon }));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dir = path.resolve(__dirname, '..', 'tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'categories.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2), { encoding: 'utf8' });
  console.log('Wrote', file);
  process.exit(0);
}

dump().catch((err) => {
  console.error('Error dumping categories:', err);
  process.exit(1);
});
