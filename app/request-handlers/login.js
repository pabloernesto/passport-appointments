import { formBody, RequestBodyParsingError } from '../util-request.js';
import { authenticateUser, generateSessionToken, isValidSessionToken } from '../authentication.js';

const loggedInEndpoints = [
  '/appointment'
];

export const match = (req) =>
  loggedInEndpoints.includes(req.url)                     // logged in endpoint
    && !isLoggedIn(req)
  || (req.method === 'POST' && req.url === '/login');     // handle logins

export function respond(req, res, database) {
  if (loggedInEndpoints.includes(req.url) && !isLoggedIn(req))
    redirectToLogin(req, res);

  else if (req.method === 'POST' && req.url === '/login')
    attemptLogin(req, res, database);
  
  return false;
}

async function attemptLogin(req, res, database) {
  try {
    const { username, password } = await formBody(req);
    const passedAuth = await authenticateUser(username, password);

    if (!passedAuth) {
      sendInvalidCredentialsResponse(res);
      return;
    }

    const sessionToken = generateSessionToken();
    res.setHeader('Set-Cookie', `sessionToken=${sessionToken}; HttpOnly; SameSite=Strict`);
    redirectToRedirectPage(req, res);

  } catch (error) {
    if (error instanceof RequestBodyParsingError) {
      logRequestBodyParsingError(error, req);
    } else {
      sendErrorResponse(res, 400, error.message);
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

function isLoggedIn(req) {
  // Extract cookies from the cookie header using querystring.parse()
  // If the cookie header is undefined, provide an empty string as the default value
  // Cookies are joined with "; "
  const cookies = querystring.parse(req.headers?.cookie || '', '; ');

  const sessionToken = cookies.sessionToken;
  return sessionToken && isValidSessionToken(sessionToken);
}

function redirectToLogin(req, res) {
  const currentURL = req.url;
  res.statusCode = 302;
  res.setHeader('Location', `/login?redirect=${encodeURIComponent(currentURL)}`);
  res.end();
}

function sendInvalidCredentialsResponse(res) {
  res.statusCode = 401;
  res.end('Invalid username or password.');
}

function redirectToRedirectPage(req, res) {
  const redirectURL = getRedirectURL(req);
  res.statusCode = 302;
  res.setHeader('Location', redirectURL);
  res.end();
}

function getRedirectURL(req) {
  const redirectParam = req.query.redirect;
  return redirectParam ? decodeURIComponent(redirectParam) : '/';
}
