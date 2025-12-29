
const Customer = (sequelize, DataTypes) => {
  const CustomerModel = sequelize.define(
    "Customer",
    {
      mobile: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: "Phone number as username for easy login",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      otpCode: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Last generated OTP for email login",
      },
      otpExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "OTP expiry timestamp",
      },
    },
    {
      tableName: "customers",
      timestamps: true,
    }
  );
  return CustomerModel;
};

export default Customer;
