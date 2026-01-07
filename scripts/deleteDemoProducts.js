#!/usr/bin/env node
import { sequelize, models } from '../config/database.js';
import { Op } from 'sequelize';

async function main() {
  try {
    await sequelize.authenticate();
    const { Product } = models;

    const demoTitles = [
      'Sample Product for Groceries',
      'Sample Product for Flowers',
      'Sample Product for Local Services',
      'Sample Product for Pet Services',
      'Sample Product for Consultancy',
      'Sample Product for Crackers'
    ];

    const deleted = await Product.destroy({
      where: {
        [Op.or]: [
          { title: { [Op.like]: 'Sample Product%' } },
          { title: demoTitles }
        ]
      }
    });

    console.log(`Deleted ${deleted} demo product(s)`);
    process.exit(0);
  } catch (err) {
    console.error('Error deleting demo products:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
