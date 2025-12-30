const Product = (sequelize, DataTypes) => {
  return sequelize.define(
    "Product",
    {
      title: { type: DataTypes.STRING, allowNull: false },
      titleKannada: DataTypes.STRING, // Kannada translation
      description: DataTypes.TEXT,
      descriptionKannada: DataTypes.TEXT, // Kannada translation
      price: { type: DataTypes.FLOAT, allowNull: false },
      variety: DataTypes.STRING,      // e.g., "Bound", "Unbound"
      subVariety: DataTypes.STRING,   // e.g., "Packaged", "Loose"
      unit: DataTypes.STRING,         // e.g., "kg", "piece"
      supplierId: DataTypes.INTEGER,
      isService: { type: DataTypes.BOOLEAN, defaultValue: true },
      deliveryAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
      isTemplate: { type: DataTypes.BOOLEAN, defaultValue: false },
      metadata: DataTypes.JSON,
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      tableName: "Products",   // 🔥 THIS IS THE CRITICAL FIX
      timestamps: true,        // matches createdAt / updatedAt in DB
    }
  );
};

export default Product;
