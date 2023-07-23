import { formBody, RequestBodyParsingError } from './util-request.js';
import Authentication from '../auth.js';
import querystring from 'node:querystring';

const loggedInEndpoints = [
  '/appointment'
];

export default class AuthenticationMW {
  constructor(database) {
    this.auth = new Authentication(database);
    // TODO: remove
    this.auth.createUser("Jim", "jim@example.com", "1234");
  }

  respond(req, res) {
    // redirect unauthenticated requests
    if (loggedInEndpoints.includes(req.url)) {
      redirectToLogin(req, res);
      return false;
    }

    // prevent double login or registration
    if (isLoggedIn(req, this.auth)) {
      req.url = "/already-logged-in.html"
      return true;
    }

    // let static files handle GET requests
    if (req.method !== 'POST') {
      return true;
    }

    if (req.url.split('?')[0] === '/login') {
      attemptLogin(req, res, this.auth);
      return false;
    }

    if (req.url.split('?')[0] === '/register') {
      attemptRegistration(req, res, this.auth);
      return false;
    }

    return false; // not a handled request
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

    const sessionToken = auth.generateSessionToken();
    addCookie(res, `sessionToken=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`);
    redirectToRedirectPage(req, res);

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
  // Extract cookies from the cookie header using querystring.parse()
  // If the cookie header is undefined, provide an empty string as the default value
  // Cookies are joined with "; "
  const cookies = querystring.parse(req.headers?.cookie || '', '; ');

  const sessionToken = cookies.sessionToken;
  return sessionToken && auth && auth.isValidSessionToken(sessionToken);
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

    const sessionToken = auth.generateSessionToken();
    addCookie(res, `sessionToken=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`);
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
  const body = `\
<!DOCTYPE html>
<html lang="en" class="booting">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>bookmarkname</title>

  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <!-- <link rel="icon" href="favicon.ico" type="image/x-icon" /> -->
  <!-- <meta name="description" content="blurb for google search" />  -->
  <!-- <link rel="canonical" href="www.mysite.com/index.html" > -->

  <!-- <link rel="stylesheet" href="my-css-file.css" /> -->
  <!-- <script src="main.js" module></script> -->
</head>
<body>
  <p>
  The <span class="username">${ username }</span> username
  and/or <span class="email">${ email }</span> email
  are already in use.
  </p>
  <p>
  Please
  <a href="/register">try again</a>.
  </p>
</body>
</html>`;
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
