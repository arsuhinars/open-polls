/* eslint-disable */
require('dotenv').config();

import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import config from '../config';
import { initDatabase } from './db';
import site from './site';
import api from './api';
import auth from './auth';
/* eslint-enable */

const app = express();

console.log();
console.log('\x1b[34mopen-polls \x1b[0mby \x1b[33marsuhinars\x1b[0m');
console.log('\x1b[44mhttps://github.com/arsuhinars/open-polls\x1b[0m');
console.log();

initDatabase()
  .then(() => {
    app.use(bodyParser.json());
    app.use(session({
      secret: process.env.SECRET || '',
      saveUninitialized: true,
      resave: false,
    }));
    app.use(api);
    app.use(auth);
    app.use(site);
    app.listen(config.port, () => {
      console.log('Server started on', config.port, 'port');
    });
  })
  .catch((reason) => {
    console.error(reason);
  });
