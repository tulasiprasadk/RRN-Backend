#!/usr/bin/env node
import { models, sequelize } from "../config/database.js";

const { Category } = models;

const desired = [
  { name: "Crackers", icon: "🎆" },
  { name: "Flowers", icon: "🌸" },
  { name: "Groceries", icon: "🛒" },
  { name: "Local Services", icon: "🛠️" },
  { name: "Pet Services", icon: "🐾" },
  { name: "Consultancy", icon: "💼" }
];

async function ensure() {
  await sequelize.authenticate();
  await sequelize.sync();

  console.log("Ensuring desired categories exist (case-insensitive)...");

  for (const d of desired) {
    const lower = d.name.toLowerCase();
    const existing = await Category.findOne({
      where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), lower)
    });

    if (existing) {
      if (existing.icon !== d.icon) {
        existing.icon = d.icon;
        await existing.save();
        console.log(`Updated icon for existing category: ${existing.name}`);
      } else {
        console.log(`Found existing category: ${existing.name}`);
      }
    } else {
      await Category.create(d);
      console.log(`Created category: ${d.name}`);
    }
  }

  const all = await Category.findAll({ order: [['name','ASC']] });
  console.log('\nCurrent categories:');
  for (const c of all) {
    console.log(`- ${c.id}: ${c.name} ${c.icon || ''}`);
  }

  const undesired = all.filter(c => !desired.find(d => d.name.toLowerCase() === c.name.toLowerCase()));
  if (undesired.length > 0) {
    console.log('\nCategories not in desired list (left untouched):');
    for (const c of undesired) console.log(`- ${c.id}: ${c.name}`);
  }

  process.exit(0);
}

ensure().catch(err => {
  console.error('Error ensuring categories:', err);
  process.exit(1);
});
