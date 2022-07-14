import {
  Model, InferAttributes, InferCreationAttributes, Sequelize, DataTypes,
} from 'sequelize';

export class PollOptionChoice extends Model<
InferAttributes<PollOptionChoice>, InferCreationAttributes<PollOptionChoice>
> {
  declare userId: number;

  declare pollId: number;

  declare optionIndex: number;
}

export function init(sequelize: Sequelize) {
  PollOptionChoice.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pollId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    optionIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    indexes: [
      {
        fields: ['userId'],
        using: 'HASH',
      },
      {
        fields: ['pollId'],
        using: 'HASH',
      },
      {
        fields: ['userId', 'pollId', 'optionIndex'],
        unique: true,
      },
    ],
  });
}
