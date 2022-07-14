import path from 'path';
import express from 'express';
import config from '../config';

const site = express();

site.get('/', (req, res) => {
  res.sendFile(path.join(config.siteResourcesPath, 'index.html'));
});
site.use('/', express.static(config.siteResourcesPath));

export default site;
