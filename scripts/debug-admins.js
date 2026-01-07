import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';
const { Admin } = models;

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const admins = await Admin.findAll();
    console.log(`Found ${admins.length} admin(s)`);
    for (const a of admins) {
      console.log({ id: a.id, email: a.email, isActive: a.isActive, passwordLength: a.password ? a.password.length : 0 });
    }

    const targetEmail = 'admin@rrnagar.com';
    const admin = await Admin.findOne({ where: { email: targetEmail } });
    if (admin) {
      const ok = await bcrypt.compare('admin123', admin.password);
      console.log(`Password check for ${targetEmail} with 'admin123':`, ok);
    } else {
      console.log(`No admin found with email ${targetEmail}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Debug script error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
