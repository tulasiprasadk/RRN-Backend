import { Sequelize } from 'sequelize';
import initModels from '../models/index.js';

async function main() {
  try {
    const databaseUrl = process.env.DATABASE_URL || process.argv[2];
    if (!databaseUrl) {
      console.error('Provide DATABASE_URL as env or arg');
      process.exit(1);
    }

    const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
    const sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    });

    const models = initModels(sequelize);
    await sequelize.authenticate();

    const Category = models.Category;
    const Product = models.Product;

    const pattern = '%cracker%';
    const cats = await Category.findAll({ where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), 'LIKE', pattern) });

    if (!cats.length) {
      console.log('No categories matching "%cracker%"');
      await sequelize.close();
      process.exit(0);
    }

    let total = 0;
    for (const c of cats) {
      const count = await Product.count({ where: { CategoryId: c.id } });
      console.log(`Category id=${c.id} name='${c.name}' => products=${count}`);
      total += count;
    }
    console.log(`Total products across matched categories: ${total}`);

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
