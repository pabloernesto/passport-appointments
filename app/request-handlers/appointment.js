function match(req) {
  const { method, url } = req;
  return method === "POST" && url === "/appointment";
}

function formBody(req) {
  return new Promise((resolve, reject) => {
    // your code goes here
    // when you get the data, call resolve(data)
    // if you encounter an error, call reject(error)
  });
}

async function respond(req, res, db) {
  res.statusCode = 200;
  const body = await formBody(req);
  // handle the request
}

export default { match, respond };
