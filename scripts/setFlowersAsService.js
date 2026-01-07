#!/usr/bin/env node
import { sequelize, models } from '../config/database.js';

async function main() {
  try {
    await sequelize.authenticate();
    const { Product, Category } = models;

    const flowers = await Category.findOne({ where: { name: 'Flowers' } }) || await Category.findOne({ where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), 'flowers') });
    if (!flowers) {
      console.error('Flowers category not found.');
      process.exit(1);
    }

    const [updated] = await Product.update(
      { isService: true, deliveryAvailable: true },
      { where: { CategoryId: flowers.id } }
    );

    console.log(`Updated ${updated} product(s) in Flowers to isService=true, deliveryAvailable=true`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
