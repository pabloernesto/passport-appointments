import Authentication from '../auth.js';
import querystring from 'node:querystring';
import { loggedInEndpoints } from './const.js';

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
    if (trec.val)
      ctx.user = trec.val.user_id;
    const logged = trec.val;

    // NOTE: we don't actually care about the host or protocol.
    //  sadly, it is a standard interface demand and it beats writing a regex.
    const _url = new URL(req.url, 'http://localhost');
    const endpoint = _url.pathname;

    // redirect unauthenticated requests
    if (Object.keys(loggedInEndpoints).includes(endpoint) && !logged) {
      redirectToLogin(req, res);
      return true;
    }

    // prevent double login or registration
    if (["/login", "/register"].includes(endpoint) && logged) {
      req.url = "/already-logged-in.html";
      req.method = "GET";
      return false;
    }

    // login
    if (req.method === 'POST' && endpoint === '/login' && !logged) {
      this._attemptLogin(req, res, ctx);
      return true;
    }

    // registration
    if (req.method === 'POST' && endpoint === '/register' && !logged) {
      this._attemptRegistration(req, res, ctx);
      return true;
    }

    // logout
    if (endpoint === '/logout' && logged) {
      this._attemptLogout(req, res, ctx);
      return true;
    }

    // request to controlled endpoint
    if (Object.keys(loggedInEndpoints).includes(endpoint) && logged) {
      const allowed_roles = loggedInEndpoints[endpoint].roles;
      // request comes from a logged in user, guaranteed to succeed
      const { val: user } = await this.auth.getUser(ctx.user);

      // authorized request, pass through
      if (allowed_roles.includes(user.role))
        return false;

      // unauthorized request, block
      // TODO: URGENT: replace with permission error page or 404
      req.url = "/unauthorized-access.html";
      req.method = "GET";
      res.statusCode = 403;
      return false;
    }

    // request to public endpoint, pass through
    return false;
  }

  async _attemptLogin(req, res, ctx) {
    try {
      const { username, password } = ctx.body;
      const passedAuth = await this.auth.authenticateUser(username, password);
  
      if (!passedAuth.val) {
        sendInvalidCredentialsResponse(res);
        return;
      }
  
      // TODO: fugly; auth.authenticateUser() should return Val(token)
      const sessionToken = this.auth.generateLoginSessionToken(username);
      if (sessionToken.err)
        throw Error("Could not get token");
      addCookie(res, `sessionToken=${sessionToken.val}; HttpOnly; SameSite=Strict; Path=/`);
      redirectToRedirectPage(req, res);
  
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  async _attemptRegistration(req, res, ctx) {
    let username, email, password;
    try {
      ({ username, email, password } = ctx);
      await this.auth.createUser(username, email, password);
  
      const sessionToken = this.auth.generateLoginSessionToken(username);
      if (sessionToken.err)
        throw Error("Could not get token");
      
      addCookie(res, `sessionToken=${sessionToken.val}; HttpOnly; SameSite=Strict; Path=/`);
      redirectToRedirectPage(req, res);
  
    } catch (error) {
      if (error.message === "Failed to add user"
          && error.cause.toString().includes('UNIQUE constraint failed')) {
        sendUserOrPasswordExistsResponse(req, res, username, email);
      } else {
        sendErrorResponse(res, error);
      }
    }
  }

  async _attemptLogout(req, res, ctx) {
    try {
      const sessionToken = getTokenFromRequest(req);
      await this.auth.invalidateToken(sessionToken);
      redirectHome(req, res);
    } catch (error) {
      if (error instanceof RequestBodyParsingError) {
        logRequestBodyParsingError(error, req);
      } else {
        sendErrorResponse(res, error);
      }
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
