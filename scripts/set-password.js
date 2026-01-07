#!/usr/bin/env node
/**
 * Usage: node backend/scripts/set-password.js <role> <identifier> <newPassword>
 * role: admin|supplier|customer
 * identifier: email (for admin/customer/supplier)
 */

import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';

async function main() {
  const [,, role, identifier, newPassword] = process.argv;
  if (!role || !identifier || !newPassword) {
    console.error('Usage: node backend/scripts/set-password.js <role> <email> <newPassword>');
    process.exit(1);
  }

  await sequelize.sync();

  let Model;
  if (role === 'admin') Model = models.Admin;
  else if (role === 'supplier') Model = models.Supplier;
  else if (role === 'customer') Model = models.Customer;
  else {
    console.error('Unknown role:', role);
    process.exit(1);
  }

  const user = await Model.findOne({ where: { email: identifier } });
  if (!user) {
    console.error('User not found for', identifier);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  user.password = hash;
  await user.save();
  console.log(`Password updated for ${role} ${identifier}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err && err.stack ? err.stack : err);
  process.exit(1);
});
