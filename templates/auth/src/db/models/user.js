import { DataTypes } from "sequelize";
import sequelize from "#lib/db/connect.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user",
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "active",
  },
  google_id: {
    type: DataTypes.STRING(191),
    allowNull: true,
    unique: true,
  },
  reset_password_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "users",
  underscored: true,
  timestamps: true,
});

export default User;
