import { DataTypes } from "sequelize";
import getAdmin from "./Admin.js";
import getAd from "./Ad.js";
import getSupplier from "./Supplier.js";
import getCategory from "./Category.js";
import getProduct from "./Product.js";
import getOrder from "./Order.js";
import getAnalyticsVisit from "./AnalyticsVisit.js";
import getStockHistory from "./StockHistory.js";
import getShop from "./Shop.js";
import getCustomer from "./Customer.js";
import getCartItem from "./CartItem.js";
import getAddress from "./Address.js";
import getNotification from "./Notification.js";
import getVariety from "./Variety.js";

export default function initModels(sequelize) {
  const Admin = getAdmin(sequelize, DataTypes);
  const Ad = getAd(sequelize, DataTypes);
  const Supplier = getSupplier(sequelize, DataTypes);
  const Category = getCategory(sequelize, DataTypes);
  const Product = getProduct(sequelize, DataTypes);
  const Order = getOrder(sequelize, DataTypes);
  const AnalyticsVisit = getAnalyticsVisit(sequelize, DataTypes);
  const StockHistory = getStockHistory(sequelize, DataTypes);
  const Shop = getShop(sequelize, DataTypes);
  const Customer = getCustomer(sequelize, DataTypes);
  const CartItem = getCartItem(sequelize, DataTypes);
  const Address = getAddress(sequelize, DataTypes);
  const Notification = getNotification(sequelize, DataTypes);
  const Variety = getVariety(sequelize, DataTypes);

  // Junction table
  const ProductSupplier = sequelize.define("ProductSupplier", {
    price: DataTypes.FLOAT,
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  });

  /* associations (same as you already wrote) */
  Customer.hasMany(CartItem, { foreignKey: 'customerId' });
  CartItem.belongsTo(Customer, { foreignKey: 'customerId' });
  Product.hasMany(CartItem, { foreignKey: 'productId' });
  CartItem.belongsTo(Product, { foreignKey: 'productId' });

  Product.belongsToMany(Supplier, { through: ProductSupplier, as: "suppliers" });
  Supplier.belongsToMany(Product, { through: ProductSupplier, as: "products" });

  Category.hasMany(Product);
  Product.belongsTo(Category);

  Category.hasMany(Variety);
  Variety.belongsTo(Category);

  Supplier.hasMany(Order, { foreignKey: 'supplierId' });
  Order.belongsTo(Supplier, { foreignKey: 'supplierId' });

  Product.hasMany(Order, { foreignKey: 'productId' });
  Order.belongsTo(Product, { foreignKey: 'productId' });

  Product.hasMany(StockHistory);
  StockHistory.belongsTo(Product);

  Customer.hasMany(Order, { foreignKey: 'customerId' });
  Order.belongsTo(Customer, { foreignKey: 'customerId' });

  Address.hasMany(Order, { foreignKey: 'addressId' });
  Order.belongsTo(Address, { foreignKey: 'addressId' });

  Customer.hasMany(Address);
  Address.belongsTo(Customer);

  return {
    Admin,
    Ad,
    Supplier,
    Category,
    Product,
    Order,
    AnalyticsVisit,
    StockHistory,
    Shop,
    Customer,
    CartItem,
    Address,
    Notification,
    Variety,
    ProductSupplier
  };
}
