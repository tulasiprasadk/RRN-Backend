import 'dotenv/config';
import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';
const { Supplier } = models;

async function run() {
  await sequelize.sync();

  const email = process.env.TEST_SUPPLIER_EMAIL || 'testsupplier@example.com';
  const phone = process.env.TEST_SUPPLIER_PHONE || '9000000000';
  const password = process.env.TEST_SUPPLIER_PASSWORD || 'supplier123';

  const hash = await bcrypt.hash(password, 10);

  let supplier = await Supplier.findOne({ where: { email } });
  if (supplier) {
    await supplier.update({ phone, password: hash, status: 'approved', acceptedTnC: true });
    console.log(`Updated supplier ${email} (approved). Login with phone=${phone} password=${password}`);
  } else {
    supplier = await Supplier.create({
      name: 'Test Supplier',
      email,
      phone,
      password: hash,
      status: 'approved',
      acceptedTnC: true
    });
    console.log(`Created supplier ${email} (approved). Login with phone=${phone} password=${password}`);
  }

  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
