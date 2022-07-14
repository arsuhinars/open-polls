import { Sequelize, Options } from 'sequelize';
import { init as initUser, User } from './models/user';
import { init as initPost, Post } from './models/post';
import { init as initPoll, Poll } from './models/poll';
import { init as initPollOptionChoice, PollOptionChoice } from './models/pollOptionChoice';

const sequelize = new Sequelize(
    <Options> {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      dialect: 'postgres',
      logging: false,
    },
);

export default sequelize;

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database were connected successfuly!');
  } catch (e: any) {
    throw new Error(`Unable to connect to database: ${e.toString()}`);
  }

  initUser(sequelize);
  initPoll(sequelize);
  initPost(sequelize);
  initPollOptionChoice(sequelize);

  User.hasMany(Post);
  User.hasMany(PollOptionChoice);

  Post.hasOne(
    User,
    {
      foreignKey: 'authorId',
      as: 'Author',
    },
  );
  Post.hasMany(Poll);

  Poll.belongsTo(
    Post,
    {
      foreignKey: 'postId',
    },
  );
  Poll.hasMany(PollOptionChoice);

  PollOptionChoice.belongsTo(
    User,
    {
      foreignKey: 'userId',
    },
  );
  PollOptionChoice.belongsTo(
    Poll,
    {
      foreignKey: 'pollId',
    },
  );

  try {
    await sequelize.sync({ force: process.env.FORCE_SYNC === 'true' || false });
  } catch (e: any) {
    throw new Error(`Unable to sync database: ${e.toString()}`);
  }
}
