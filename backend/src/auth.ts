import axios, { AxiosError } from 'axios';
import express, { Request } from 'express';
import { ErrorTypes } from 'open-polls';
import { User as FrontendUser } from 'open-polls-frontend';
import config from '../config';
import { User } from './models/user';

const VK_API_URL = 'https://api.vk.com/method/';
const VK_CLIENT_ID = process.env.VK_CLIENT_ID || '';
const VK_API_VERSION = '5.131';

const auth = express();

interface AuthData {
  accessToken: string;
  expiresAt: number;
  vkId: number;
}

declare module 'express-session' {
  interface SessionData {
    redirectURL: string | undefined;
    user: User | undefined;
    authData: AuthData | undefined;
  }
}

// eslint-disable-next-line max-len
async function sendVkMethod(request: Request, method: string, params: { [key: string]: string } | undefined) {
  const url = new URL(method, VK_API_URL);
  if (params) {
    Object.keys(params).forEach((key) => {
      url.searchParams.append(key, params[key]);
    });
  }
  url.searchParams.append('access_token', request.session.authData?.accessToken || '');
  url.searchParams.append('v', VK_API_VERSION);
  try {
    const result = await axios.get(url.href);
    return result.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.log('VK method error:', error.response);
      } else {
        console.log('AxiosError:', error.message);
      }
    }
    return null;
  }
}

async function handleLogin(request: Request) {
  const result = await sendVkMethod(request, 'users.get', {
    fields: 'photo_100',
  });
  if (result == null) {
    return;
  }

  const profileData = result.response[0];

  let user = await User.findOne({ where: { vkId: request.session.authData?.vkId } });
  if (user) {
    if (user.isActive) {
      user.name = profileData.first_name;
      user.photoURL = profileData.photo_100;
      user.save();
    } else {
      throw new Error('User is not active');
    }
  } else {
    user = await User.create({
      vkId: parseInt(profileData.id, 10),
      name: profileData.first_name,
      photoURL: profileData.photo_100,
    });
  }

  request.session.user = user;
}

auth.get('/auth/login', (req, res) => {
  const redirectURL = new URL('/auth/callback', config.host);
  redirectURL.searchParams.append('redirectPath', req.query.redirectPath?.toString() || '');

  req.session.redirectURL = redirectURL.href;

  const authURL = new URL(config.vkAuthBaseURL);
  authURL.searchParams.append('client_id', VK_CLIENT_ID);
  authURL.searchParams.append('redirect_uri', redirectURL.href);
  authURL.searchParams.append('display', 'page');
  authURL.searchParams.append('scope', '');
  authURL.searchParams.append('response_type', 'code');
  authURL.searchParams.append('v', VK_API_VERSION);

  res.redirect(authURL.href);
});

auth.get('/auth/callback', (req, res) => {
  if (req.query.error) {
    console.log('VK login error:', req.query.error, req.query.error_description);

    res.status(500).json({ error: ErrorTypes.VK_LOGIN_ERROR });
  } else {
    const accessTokenURL = new URL(config.vkAccessTokenURL);
    accessTokenURL.searchParams.append('client_id', VK_CLIENT_ID);
    accessTokenURL.searchParams.append('client_secret', process.env.VK_SECRET || '');
    accessTokenURL.searchParams.append('redirect_uri', req.session.redirectURL || '');
    accessTokenURL.searchParams.append('code', req.query.code?.toString() || '');

    req.session.redirectURL = undefined;

    axios.get(accessTokenURL.href)
      .then((res_) => {
        const authData = <AuthData>{
          accessToken: res_.data.access_token,
          expiresAt: Math.floor(Date.now() / 1000) + res_.data.expires_in,
          vkId: res_.data.user_id,
        };
        req.session.authData = authData;
        return handleLogin(req);
      })
      .then(() => {
        res.redirect(req.query.redirectPath?.toString() || '/');
      })
      .catch((error) => {
        if (error instanceof AxiosError) {
          if (error.response) {
            console.log('VK login error:', error.response.data);
          } else {
            console.log('AxiosError:', error.message);
          }
          res.redirect(`/#/handleError/${ErrorTypes.VK_LOGIN_ERROR}`);
        } else {
          console.log('User login error:', (error as Error).message);
          res.redirect(`/#/handleError/${ErrorTypes.UNKNOWN_ERROR}`);
        }
      });
  }
});

auth.get('/auth/user', (req, res) => {
  if (req.session.authData == null || req.session.user == null) {
    res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
    return;
  }

  const { user } = req.session;

  const frontendUser = new FrontendUser();
  frontendUser.id = user.id;
  frontendUser.name = user.name;
  frontendUser.registrationDate = user.registrationDate;

  res.json({ user: frontendUser, photo: user.photoURL });
});

auth.get('/auth/logout', (req, res) => {
  if (req.session.authData == null) {
    res.status(401).json({ errorCode: ErrorTypes.AUTHORIZATION_REQUIRED });
    return;
  }

  req.session.authData = undefined;
  req.session.user = undefined;

  res.json();
});

auth.use((req, res, next) => {
  if (req.session.authData == null) {
    next();
    return;
  }

  const time = Math.floor(Date.now() / 1000);
  if (time >= req.session.authData.expiresAt) {
    req.session.authData = undefined;
    req.session.user = undefined;
  }

  next();
});

export function isAuthorized(request: Request) {
  return request.session.authData != null && request.session.user != null;
}

export function getUser(request: Request) {
  return request.session.user;
}

export default auth;
