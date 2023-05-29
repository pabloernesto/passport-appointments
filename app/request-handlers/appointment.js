function match(req) {
  const { method, url } = req;
  return method === "POST" && url === "/appointment";
}

function formBody(request) {
  return new Promise((resolve, reject) => {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      // at this point, `body` has the entire request body stored in it as a string
      body = body.substring("userid=".length)
      resolve({'userid': body})
    }).on('error', (e) => {
      reject(e);
    });
  });
}

async function respond(req, res, db) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  const body = await formBody(req);
  res.end(`User ${ body.userid }, you have your appointment.`);
}

export default { match, respond };
