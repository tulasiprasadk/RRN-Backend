
import express from 'express';
import { models } from '../../config/database.js';
const { Product, Supplier, ProductSupplier } = models;
const router = express.Router();

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const upload = multer({ dest: path.join(process.cwd(), 'tmp') });

// Get suppliers for a product
router.get('/:productId/suppliers', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: [{
        model: Supplier,
        as: 'suppliers',
        through: { attributes: ['price', 'stock', 'isActive'] }
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product.suppliers || []);
  } catch (error) {
    console.error('Error fetching product suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Assign supplier to product
router.post('/:productId/suppliers', async (req, res) => {
  try {
    const { supplierId, price, stock } = req.body;
    
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if already assigned
    const existing = await ProductSupplier.findOne({
      where: { productId: req.params.productId, supplierId }
    });

    if (existing) {
      // Update existing
      await existing.update({ price, stock, isActive: true });
      return res.json({ message: 'Supplier updated', productSupplier: existing });
    }

    // Create new assignment
    await product.addSupplier(supplier, {
      through: { price, stock, isActive: true }
    });

    res.json({ message: 'Supplier assigned to product' });
  } catch (error) {
    console.error('Error assigning supplier:', error);
    res.status(500).json({ error: 'Failed to assign supplier' });
  }
});

// Remove supplier from product
router.delete('/:productId/suppliers/:supplierId', async (req, res) => {
  try {
    const deleted = await ProductSupplier.destroy({
      where: {
        productId: req.params.productId,
        supplierId: req.params.supplierId
      }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Supplier removed from product' });
  } catch (error) {
    console.error('Error removing supplier:', error);
    res.status(500).json({ error: 'Failed to remove supplier' });
  }
});

export default router;

// CSV import endpoint for groceries
router.post('/import-groceries', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const content = fs.readFileSync(req.file.path, 'utf8');
    const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    if (!rows.length) return res.status(400).json({ error: 'no rows found in CSV' });

    // find or create Groceries category (case-insensitive). Prefer lowest id if duplicates exist.
    const { Category } = models;
    const { fn, col } = require('sequelize');
    let groceries = await Category.findOne({ where: where(fn('lower', col('name')), 'groceries'), order: [['id','ASC']] });
    if (!groceries) {
      // create if missing
      try {
        groceries = await Category.create({ name: 'Groceries', icon: '🛒' });
      } catch (e) {
        groceries = await Category.findOne({ where: where(fn('lower', col('name')), 'groceries'), order: [['id','ASC']] });
      }
    }
    if (!groceries) return res.status(400).json({ error: 'Groceries category not found or could not be created.' });

    // prepare products
    const toInsert = rows.map(r => ({
      title: (r.title || r['title'] || '').toString().trim(),
      variety: (r.variety || r['variety'] || '').toString().trim(),
      subVariety: r.subVariety || r['subVariety'] || null,
      price: Number(r.price || r['price']) || 0,
      unit: r.unit || r['unit'] || null,
      description: r.description || r['description'] || null,
      CategoryId: groceries.id,
      status: 'approved',
      isService: false,
      deliveryAvailable: true
    })).filter(p => p.title);

    // delete old groceries and insert
    await Product.destroy({ where: { CategoryId: groceries.id } });
    const created = await Product.bulkCreate(toInsert);

    // cleanup
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

    res.json({ ok: true, inserted: created.length });
  } catch (err) {
    console.error('Import groceries error:', err);
    res.status(500).json({ error: err && err.stack ? err.stack : String(err) });
  }
});
