import path from 'path';

export default {
  host: 'http://localhost:5000/',
  port: 5000,
  siteResourcesPath: path.join(path.dirname(require.resolve('open-polls-frontend')), 'dist'),
  siteRoutes: ['/', '/post', ''],
  vkAuthBaseURL: 'https://oauth.vk.com/authorize',
  vkAccessTokenURL: 'https://oauth.vk.com/access_token',
};
