import express from 'express';
import { ErrorTypes } from 'open-polls';
import { Post as FrontendPost, Poll as FrontendPoll, PollOptionChoice as FrontendOptionChoice } from 'open-polls-frontend';
import sequelize from './db';
import { User } from './models/user';
import { Poll } from './models/poll';
import { Post } from './models/post';
import { PollOptionChoice } from './models/pollOptionChoice';
import { isAuthorized, getUser } from './auth';

interface ShortenedPost {
  id: number;
  title: string;
  isPublished: boolean;
  creationDate: Date;
  editingDate: Date;
}

function verifyPost(post: FrontendPost) {
  if (typeof post !== 'object') {
    return false;
  }

  if (typeof post.title !== 'string' || post.title.length === 0) {
    return false;
  }

  if (!(post.polls instanceof Array) || post.polls.length === 0) {
    return false;
  }

  for (let i = 0; i < post.polls.length; i += 1) {
    const poll = post.polls[i];
    if (typeof poll !== 'object'
      || typeof poll.name !== 'string'
      || poll.name.length === 0
      || typeof poll.style !== 'number'
      || !(poll.options instanceof Array<string>)
      || poll.options.length === 0
      || typeof poll.maxChosenOptionsCount !== 'number'
      || poll.maxChosenOptionsCount < 1
      || poll.maxChosenOptionsCount > poll.options.length) {
      return false;
    }
  }

  return true;
}

const api = express();

api.route('/api/post/')
  .get(async (req, res) => {
    try {
      if (req.query.id) {
        const postId = parseInt(req.query.id.toString(), 10);
        if (Number.isNaN(postId)) {
          res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
          return;
        }
        const post = await Post.findByPk(postId);
        if (post == null) {
          res.status(404).json({ errorCode: ErrorTypes.NOT_FOUND_ERROR });
          return;
        }
        if (!post.isPublished && (!isAuthorized(req) || getUser(req)?.id !== post.authorId)) {
          res.status(403).json({ errorCode: ErrorTypes.FORBIDDEN });
          return;
        }
        const author = await User.findOne({ where: { id: post.authorId } });
        if (author == null) {
          console.log('Post GET error: can not find post author in database');
          res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
          return;
        }
        const polls = await Poll.findAll({ where: { postId } });

        const frontendPolls: FrontendPoll[] = [];
        for (let i = 0; i < polls.length; i += 1) {
          frontendPolls.push({
            id: polls[i].id,
            name: polls[i].name,
            style: polls[i].style,
            options: polls[i].options,
            results: [],
            answersCount: 0,
            maxChosenOptionsCount: polls[i].maxChosenOptionsCount,
          });
        }

        await Promise.all(polls.map(async (poll, index) => {
          const optionsChoices = await PollOptionChoice.findAll({ where: { pollId: poll.id } });
          const frontendPoll = frontendPolls[index];

          const users = new Set<number>();

          for (let i = 0; i < poll.options.length; i += 1) {
            frontendPoll.results.push(0);
          }

          for (let i = 0; i < optionsChoices.length; i += 1) {
            frontendPoll.results[optionsChoices[i].optionIndex] += 1;
            users.add(optionsChoices[i].userId);
          }

          frontendPoll.answersCount = users.size;
        }));

        const frontendPost: FrontendPost = {
          id: post.id,
          title: post.title,
          author: {
            id: author.id,
            name: author.name,
            registrationDate: author.registrationDate,
          },
          isPublished: post.isPublished,
          creationDate: post.creationDate,
          editingDate: post.editingDate,
          polls: frontendPolls,
        };
        res.json({ post: frontendPost });
      } else {
        res.status(404).json({ errorCode: ErrorTypes.NOT_FOUND_ERROR });
      }
    } catch (error) {
      console.log('Post GET error:', error);
      res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
    }
  })
  .post(async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
      return;
    }

    if (!verifyPost(req.body)) {
      res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
      return;
    }

    const t = await sequelize.transaction();

    try {
      const post = await Post.create({
        authorId: getUser(req)?.id || 0,
        title: req.body.title,
      }, { transaction: t });

      await Promise.all(req.body.polls.map(async (poll: FrontendPoll) => {
        await Poll.create({
          postId: post.id,
          name: poll.name,
          style: poll.style,
          options: poll.options,
          maxChosenOptionsCount: poll.maxChosenOptionsCount,
        }, { transaction: t });
      }));

      await t.commit();

      res.json({ postId: post.id });
    } catch (error) {
      await t.rollback();
      console.log('Post POST error:', (error as Error).message);
      res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
    }
  })
  .put(async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
      return;
    }

    const jsonPost = req.body as FrontendPost;
    if (!verifyPost(jsonPost) || typeof jsonPost.id !== 'number') {
      res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
      return;
    }

    const t = await sequelize.transaction();

    try {
      const post = await Post.findOne({ where: { id: jsonPost.id }, transaction: t });
      if (post == null) {
        res.status(404).json({ errorCode: ErrorTypes.NOT_FOUND_ERROR });
        return;
      }
      if (post.authorId !== getUser(req)?.id) {
        res.status(403).json({ errorCode: ErrorTypes.FORBIDDEN });
        return;
      }

      const polls = await Poll.findAll({
        where: { postId: post.id }, paranoid: false, transaction: t,
      });

      post.title = jsonPost.title;
      post.editingDate = new Date();
      await post.save({ transaction: t });

      await Promise.all(jsonPost.polls.map(async (poll, index) => {
        const pollData = {
          name: poll.name,
          style: poll.style,
          options: poll.options,
          maxChosenOptionsCount: poll.maxChosenOptionsCount,
        };

        if (index < polls.length) {
          PollOptionChoice.destroy({ where: { pollId: polls[index].id }, transaction: t });
          if (polls[index].isSoftDeleted()) {
            await polls[index].restore({ transaction: t });
          }

          polls[index].set(pollData);
          await polls[index].save({ transaction: t });
        } else {
          await Poll.create(Object.assign(pollData, {
            postId: post.id,
          }), { transaction: t });
        }
      }));
      await Promise.all(polls.slice(jsonPost.polls.length).map(async (poll) => {
        PollOptionChoice.destroy({ where: { pollId: poll.id }, transaction: t });
        await poll.destroy({ transaction: t });
      }));

      await t.commit();

      res.json({});
    } catch (error) {
      await t.rollback();
      console.log('Post PUT error:', (error as Error).message);
      res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
    }
  })
  .delete(async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
      return;
    }

    if (typeof req.query.id !== 'string') {
      res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
      return;
    }

    const postId = parseInt(req.query.id, 10);
    if (Number.isNaN(postId)) {
      res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
      return;
    }

    const t = await sequelize.transaction();

    try {
      const post = await Post.findOne({ where: { id: postId }, transaction: t });
      if (post == null) {
        res.status(404).json({ errorCode: ErrorTypes.NOT_FOUND_ERROR });
        return;
      }
      if (post.authorId !== getUser(req)?.id) {
        res.status(403).json({ errorCode: ErrorTypes.FORBIDDEN });
        return;
      }

      const polls = await Poll.findAll({ where: { postId: post.id }, transaction: t });
      await Promise.all(polls.map(async (poll) => {
        await PollOptionChoice.destroy({ where: { pollId: poll.id }, transaction: t });
        await poll.destroy({ force: true, transaction: t });
      }));

      await post.destroy({ transaction: t });

      await t.commit();

      res.json({});
    } catch (error) {
      await t.rollback();
      console.log('Post DELETE error:', (error as Error).message);
      res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
    }
  });

api.get('/api/set_post_publishing_state/', async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
    return;
  }

  if (!req.query.id) {
    res.status(404).json({ errorCode: ErrorTypes.NOT_FOUND_ERROR });
    return;
  }

  if (typeof req.query.is_published !== 'string') {
    res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
    return;
  }

  const isPublished = JSON.parse(req.query.is_published);
  if (typeof isPublished !== 'boolean') {
    res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
    return;
  }

  const t = await sequelize.transaction();

  try {
    const post = await Post.findOne({ where: { id: parseInt(req.query.id.toString(), 10) } });
    if (post == null) {
      res.status(404).json({ errorCode: ErrorTypes.NOT_FOUND_ERROR });
      return;
    }
    if (post.authorId !== getUser(req)?.id) {
      res.status(403).json({ errorCode: ErrorTypes.FORBIDDEN });
      return;
    }

    post.isPublished = isPublished;
    await post.save();

    await t.commit();

    res.json({});
  } catch (error) {
    await t.rollback();
    console.log('Post publishing error:', error);
    res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
  }
});

api.route('/api/post_options_choices')
  .get(async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
      return;
    }

    if (typeof req.query.post_id !== 'string') {
      res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
      return;
    }

    const postId = parseInt(req.query.post_id, 10);
    if (Number.isNaN(postId)) {
      res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
      return;
    }

    const userId = getUser(req)?.id;
    const result = new Array<FrontendOptionChoice>();

    try {
      const post = await Post.findOne({ where: { id: postId } });
      if (post == null) {
        res.status(404).json({ errorCode: ErrorTypes.NOT_FOUND_ERROR });
        return;
      }

      const polls = await Poll.findAll({ where: { postId } });
      await Promise.all(polls.map(async (poll) => {
        const optionsChoices = await PollOptionChoice.findAll({
          where: {
            pollId: poll.id,
            userId,
          },
        });
        optionsChoices.forEach((optionChoice) => {
          result.push({
            pollId: poll.id,
            optionIndex: optionChoice.optionIndex,
          });
        });
      }));

      res.json({ postOptionsChoices: result });
    } catch (error) {
      console.log('PostOptionChoices GET error:', (error as Error).message);
      res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
    }
  })
  .post(async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
      return;
    }

    const json = req.body;
    if (typeof json.postId !== 'number' || !(json.postOptionsChoices instanceof Array<PollOptionChoice>)) {
      res.status(400).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
      return;
    }

    const t = await sequelize.transaction();

    try {
      const post = await Post.findOne({ where: { id: json.postId }, transaction: t });
      if (post == null) {
        res.status(404).json({ errorCode: ErrorTypes.NOT_FOUND_ERROR });
        return;
      }

      const polls = await Poll.findAll({ where: { postId: post.id }, transaction: t });
      const pollsMap = new Map<number, { poll: Poll, optionsChoices: Set<number> }>();
      polls.forEach((poll) => {
        pollsMap.set(poll.id, {
          poll, optionsChoices: new Set<number>(),
        });
      });

      await Promise.all(polls.map(async (poll) => {
        await PollOptionChoice.destroy({
          where: {
            pollId: poll.id,
            userId: getUser(req)?.id,
          },
          transaction: t,
        });
      }));

      await Promise.all(json.postOptionsChoices.map(async (optionChoice: FrontendOptionChoice) => {
        if (pollsMap.has(optionChoice.pollId)) {
          const pollData = pollsMap.get(optionChoice.pollId);
          const { optionIndex } = optionChoice;
          if (optionIndex >= 0
            && optionIndex < (pollData?.poll.options?.length ?? 0)
            && !pollData?.optionsChoices.has(optionIndex)) {
            pollData?.optionsChoices.add(optionIndex);
            await PollOptionChoice.create({
              pollId: optionChoice.pollId,
              userId: getUser(req)?.id || 0,
              optionIndex,
            }, { transaction: t });
          }
        }
      }));

      await t.commit();

      res.json({});
    } catch (error) {
      await t.rollback();
      console.log('PostOptionChoices POST error:', (error as Error).message);
      res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
    }
  });

api.get('/api/my_posts/', async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
    return;
  }

  try {
    const posts = await Post.findAll({ where: { authorId: getUser(req)?.id } });

    const jsonPosts: Array<ShortenedPost> = [];
    posts.forEach((post) => {
      jsonPosts.push({
        id: post.id,
        title: post.title,
        isPublished: post.isPublished,
        creationDate: post.creationDate,
        editingDate: post.editingDate,
      });
    });

    res.json({
      posts: jsonPosts,
    });
  } catch (error) {
    console.log('MyPosts GET error:', (error as Error).message);
    res.status(500).json({ errorCode: ErrorTypes.UNKNOWN_ERROR });
  }
});

export default api;
