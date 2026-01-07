import { Sequelize } from 'sequelize';
import initModels from '../models/index.js';

async function main() {
  try {
    const databaseUrl = process.env.DATABASE_URL || process.argv[2];
    const categoryName = process.argv[3] || process.env.CATEGORY_NAME;
    if (!databaseUrl || !categoryName) {
      console.error('Usage: node checkCategory.js <DATABASE_URL> <categoryName>');
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

    const cat = await Category.findOne({ where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), categoryName.toLowerCase()) });
    if (!cat) {
      console.log(`No category '${categoryName}' found in target DB.`);
      process.exit(0);
    }

    const catId = cat.id;
    const prods = await Product.findAll({ where: { CategoryId: catId }, order: [['createdAt', 'DESC']] });

    console.log(`${cat.name} category id=${catId} — products=${prods.length}`);

    const now = Date.now();
    const recentThresholdMs = 1000 * 60 * 60 * 24; // 24 hours

    prods.forEach(p => {
      const o = p.toJSON();
      const created = new Date(o.createdAt).toISOString();
      const ageMs = now - new Date(o.createdAt).getTime();
      const recent = ageMs <= recentThresholdMs ? 'RECENT' : '';
      console.log(`- id=${o.id} title='${o.title}' price=${o.price} createdAt=${created} ${recent}`);
    });

    if (prods.length > 0) {
      const latest = prods[0].createdAt;
      const earliest = prods[prods.length - 1].createdAt;
      console.log(`Earliest: ${new Date(earliest).toISOString()}, Latest: ${new Date(latest).toISOString()}`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
