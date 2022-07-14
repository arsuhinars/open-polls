import {
  Model, InferAttributes, InferCreationAttributes, Sequelize, DataTypes, CreationOptional,
} from 'sequelize';

export class Poll extends Model<InferAttributes<Poll>, InferCreationAttributes<Poll>> {
  declare id: CreationOptional<number>;

  declare postId: number;

  declare name: string;

  declare style: number;

  declare options: Array<string>;

  declare maxChosenOptionsCount: number;
}

export function init(sequelize: Sequelize) {
  Poll.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    style: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    options: {
      type: DataTypes.ARRAY(DataTypes.STRING(32)),
      allowNull: false,
    },
    maxChosenOptionsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    paranoid: true,
    indexes: [
      {
        fields: ['postId'],
        using: 'HASH',
      },
    ],
  });
}
