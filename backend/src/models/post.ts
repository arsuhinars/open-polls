import {
  Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, DataTypes,
} from 'sequelize';

export class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: CreationOptional<number>;

  declare title: string;

  declare authorId: number;

  declare isPublished: CreationOptional<boolean>;

  declare creationDate: CreationOptional<Date>;

  declare editingDate: CreationOptional<Date>;
}

export function init(sequelize: Sequelize) {
  Post.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    creationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    editingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
    createdAt: 'creationDate',
    updatedAt: 'editingDate',
    indexes: [
      {
        fields: ['authorId'],
        using: 'HASH',
      },
    ],
  });
}
