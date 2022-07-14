import {
  Model, InferAttributes, InferCreationAttributes, Sequelize, DataTypes, CreationOptional,
} from 'sequelize';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;

  declare vkId: number;

  declare name: string;

  declare photoURL: string;

  declare registrationDate: CreationOptional<Date>;

  declare isAdmin: CreationOptional<boolean>;

  declare isActive: CreationOptional<boolean>;
}

export function init(sequelize: Sequelize) {
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    vkId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    photoURL: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    sequelize,
    timestamps: true,
    createdAt: 'registrationDate',
    updatedAt: false,
  });
}
