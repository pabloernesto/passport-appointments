const managed_endpoints = [
  "GET /appointment",
  "POST /appointment",
  "GET /login", "GET /login.html",
  "POST /login"
]

function match(req) {
  const { method, url } = req;
  return managed_endpoints.includes(`${ method } ${ url }`);
}

async function respond(req, res, db) {
  const { method, url, headers } = req;
  const sid = headers.sid;  // session ID

  // if /appointment and not logged in,
    // set continuation
    // redirect to /login
    // NOTE: if the request was an unauthenticated POST (which shouldn't happen
    //       in normal flow), we will lose form data

  // if /login and logged in,
    // modify request to login-unnecessary.html

  // if GET /login and not logged in,
    // modify request to login.html

  // if POST /login and not logged in,
    // attempt login
    // if login successful,
      // set session cookie
      // if continuation, redirect to continuation
      // else modify request to login-successful.html
    // else
      // redirect to GET /login (preserving continuation)

  // else, allow fallthrough

  if (url === "/appointment" && !validSID(sid)) {
    res.statusCode = 302;
    res.setHeader('Location', `/login?continue=/appointment`);
  }

  // res.statusCode = 302;
  // res.setHeader('Location', '/login');
  // res.end();
}

export default { match, respond };
