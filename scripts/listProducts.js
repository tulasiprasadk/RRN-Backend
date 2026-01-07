import { models, sequelize } from '../config/database.js';

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const { Product, Category } = models;
    const count = await Product.count();
    console.log(`Products count: ${count}`);

    const products = await Product.findAll({ include: [{ model: Category, attributes: ['id','name'] }], limit: 20 });
    products.forEach(p => {
      const obj = p.toJSON();
      console.log(`- id=${obj.id} title=${obj.title} category=${obj.Category ? obj.Category.name : 'null'} status=${obj.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error listing products:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
