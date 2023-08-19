import { formBody, RequestBodyParsingError } from './util-request.js';
import Authentication from '../auth.js';
import querystring from 'node:querystring';
import {adminEndpoints, loggedInEndpoints} from './const.js';
import { Err } from '../maybe.js';

export default class AuthenticationMW {
  // @private
  constructor(auth) {
    this.auth = auth;
  }

  // static async constructor. Do not use actual constructor.
  static async fromDatabase(database) {
    let auth = await Authentication.fromDatabase(database);
    return new AuthenticationMW(auth);
  }

  async respond(req, res, ctx) {
    const token = getTokenFromRequest(req);
    const trec = await this.auth.getTokenRecord(token);
    if (!trec.err)
      ctx.user = trec.val.user_id;
    const logged = !trec.err;

    // redirect unauthenticated requests
    if (loggedInEndpoints.includes(req.url) && !logged) {
      redirectToLogin(req, res);
      return true;
    }

    const operation = (
      req.url.split('?')[0] === '/login' ? 'login'
      : req.url.split('?')[0] === '/register' ? 'register'
      : undefined
    );

    const logout = (req.url.split('?')[0] === '/logout' ? 'logout' : undefined);

    // prevent double login or registration
    if (operation && logged) {
      req.url = "/already-logged-in.html";
      req.method = "GET";
      return false;
    }

    if (req.method === 'POST' && operation === 'login' && !logged) {
      attemptLogin(req, res, this.auth);
      return true;
    }

    if (req.method === 'POST' && operation === 'register' && !logged) {
      attemptRegistration(req, res, this.auth);
      return true;
    }

    // logout
    if (logout) {
      if(logged) {
        attemptLogout(req, res, this.auth);
        return true;
      }
    }

    // authorization
    if(adminEndpoints.includes(req.url) && logged) {
      const token = getTokenFromRequest(req);
      const { val: record } = this.auth.getTokenRecord(token);

      const authorization = await this.auth.userHasPermission(record.user_id, "a");
      if(authorization) {
        return false;
      } else {
        // TODO: URGENT: replace with permission error page or 404
        req.url = "/already-logged-in.html";
        req.method = "GET";
        return false;
      }
    } else {
      return false;
    }
    
  }
}

async function attemptLogin(req, res, auth) {
  try {
    const { username, password } = await formBody(req);
    const passedAuth = await auth.authenticateUser(username, password);

    if (!passedAuth) {
      sendInvalidCredentialsResponse(res);
      return;
    }

    const sessionToken = auth.generateLoginSessionToken(username);
    if (sessionToken.err)
      throw Error("Could not get token");
    addCookie(res, `sessionToken=${sessionToken.val}; HttpOnly; SameSite=Strict; Path=/`);
    redirectToRedirectPage(req, res);

  } catch (error) {
    if (error instanceof RequestBodyParsingError) {
      logRequestBodyParsingError(error, req);
    } else {
      sendErrorResponse(res, error);
    }
  }
}

async function attemptLogout(req, res, auth) {
  try {
    const sessionToken = getTokenFromRequest(req);
    await auth.invalidateToken(sessionToken);
    redirectHome(req, res);
  } catch (error) {
    if (error instanceof RequestBodyParsingError) {
      logRequestBodyParsingError(error, req);
    } else {
      sendErrorResponse(res, error);
    }
  }
}

function logRequestBodyParsingError(error, request) {
  const { method, url, headers } = request;
  const clientIP = getClientIP(request);
  const headerstr = Object.entries(headers)
    .map(([name, value]) => `    ${name}: ${value}`)
    .join('\n');

  console.error(`
RequestBodyParsingError:
  Error Message: ${error.message}
  Request Method: ${method}
  Request URL: ${url}
  Request Headers:
${headerstr}
  Client IP: ${clientIP}
`);
}

function sendErrorResponse(res, err) {
  res.statusCode = 400;
  res.setHeader('Content-Type', 'text/plain');
  res.end(err.toString());
}

// TODO: BUG: null under certain circumstances
function isLoggedIn(req, auth) {
  const sessionToken = getTokenFromRequest(req);
  return auth.isValidSessionToken(sessionToken).val;
}

function getTokenFromRequest(req) {
  // Extract cookies from the cookie header using querystring.parse()
  // If the cookie header is undefined, provide an empty string as the default value
  // Cookies are joined with "; "
  const cookies = querystring.parse(req.headers?.cookie || '', '; ');
  return cookies.sessionToken;
}

function redirectToLogin(req, res) {
  const currentURL = req.url;
  const redirectURL = getRedirectURL(req) || currentURL;
  addCookie(res, `redirect=${redirectURL}; Path=/`);

  res.statusCode = 302;
  res.setHeader('Location', '/login');
  res.end();
}

function sendInvalidCredentialsResponse(res) {
  res.statusCode = 401;
  res.end('Invalid username or password.');
}

function redirectToRedirectPage(req, res) {
  res.statusCode = 302;
  const redirectURL = getRedirectURL(req) ?? '/';
  res.setHeader('Location', redirectURL);
  addCookie(res, `redirect=; Path=/; Max-Age=0`);
  res.end();
}

function redirectHome(req, res) {
  res.statusCode = 302;
  res.setHeader('Location', '/index');
  addCookie(res, `redirect=; Path=/index; Max-Age=0`);
  res.end();
}

function getRedirectURL(req) {
  // note: `req.headers.cookie`, if present, will be a `; `-separated string
  // of `key=value` pairs. any given key may appear more than once.
  //
  // querystring will turn the cookie string into a null-prototype object.
  // duplicated keys in the cookie string result in an Array-typed value.
  // the cookie string is automatically passed through decodeURIComponent
  // see: https://nodejs.org/dist/latest-v18.x/docs/api/querystring.html
  const cookies = querystring.parse(req.headers?.cookie || '', '; ');

  return cookies.redirect;
}

async function attemptRegistration(req, res, auth) {
  let username, email, password;
  try {
    ({ username, email, password } = await formBody(req));
    await auth.createUser(username, email, password);

    const sessionToken = auth.generateLoginSessionToken(username);
    if (sessionToken.err)
      throw Error("Could not get token");
    
    addCookie(res, `sessionToken=${sessionToken.val}; HttpOnly; SameSite=Strict; Path=/`);
    redirectToRedirectPage(req, res);

  } catch (error) {
    if (error instanceof RequestBodyParsingError) {
      logRequestBodyParsingError(error, req);
    } else if (error.message === "Failed to add user"
        && error.cause.toString().includes('UNIQUE constraint failed')) {
      sendUserOrPasswordExistsResponse(req, res, username, email);
    } else {
      sendErrorResponse(res, error);
    }
  }
}

function sendUserOrPasswordExistsResponse(req, res, username, email) {
  res.statusCode = 409;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const body = HTMLWrap(`
  <p>
  The <span class="username">${ username }</span> username
  and/or <span class="email">${ email }</span> email
  are already in use.
  </p>
  <p>
  Please
  <a href="/register">try again</a>.
  </p>`);
  res.end(body);
}

function addCookie(res, cookiestr) {
  const curcookies = res.getHeader('Set-Cookie');
  if (curcookies === undefined) {
    res.setHeader('Set-Cookie', [ cookiestr ]);
  } else {
    curcookies.push(cookiestr);
  }
}
