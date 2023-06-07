import querystring from 'node:querystring';

export function formBody(request) {
  return new Promise((resolve, reject) => {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      // at this point, `body` has the entire request body stored in it as a string
      body = querystring.parse(body);
      console.log(body);
      resolve(body)
    }).on('error', (e) => {
      reject(e);
    });
  });
}
