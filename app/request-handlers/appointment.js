function match(req) {
  const { method, url } = req;
  return method === "POST" && url === "/appointment";
}

function formBody(req) {
  return new Promise((resolve, reject) => {
    // your code goes here
    // when you get the data, call resolve(data)
    // if you encounter an error, call reject(error)
    resolve({ userid: 123 });
  });
}

async function respond(req, res, db) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  const body = await formBody(req);
  res.end(`User ${ body.userid }, you have your appointment.`);
}

export default { match, respond };
