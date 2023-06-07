import { formBody } from '../util-request.js';

const managed_endpoints = [
  "GET /login", "GET /login.html",  // get login form
  "POST /login",                    // submit login form

  // secure areas
  "GET /appointment",
  "POST /appointment"
]

function match(req) {
  const { method, url } = req;
  return managed_endpoints.includes(`${ method } ${ url }`);
}

async function respond(req, res, db) {
  const { method, url, headers } = req;
  const sid = headers.sid;  // session ID

  // if GET /login and not logged in,
    // modify request to login.html

  // if /login and logged in,
    // modify request to login-unnecessary.html

  // if POST /login and not logged in,
    // attempt login
    // if login successful,
      // set session cookie
      // if continuation, redirect to continuation
      // else modify request to login-successful.html
    // else
      // redirect to GET /login (preserving continuation)

  // if managed and not logged in,
    // set continuation
    // redirect to /login
    // NOTE: if the request was an unauthenticated POST (which shouldn't happen
    //       in normal flow), we will lose form data

  // else, allow fallthrough

  if (url === "/login" && validSID(sid)) {
    req.url = "login-unnecessary.html";
    return true;
  }

  if (method === "GET" && url === "/login" && !validSID(sid)) {
    req.url = "login.html";
    return true;
  }

  if (method === "POST" && url === "/login" && !validSID(sid)) {
    // TODO: login
    const { user, pass } = await formBody(req);
    // db.
  }

  if (!validSID(sid)) {
    res.statusCode = 302;
    res.setHeader('Location', `/login?continue=/appointment`);
    res.end();
  }
}

function validSID(sid) {
  return true;
}

export default { match, respond };
