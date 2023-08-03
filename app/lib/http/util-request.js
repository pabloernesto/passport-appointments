import querystring from 'node:querystring';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit

export class RequestBodyParsingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RequestBodyParsingError';
  }
}

export function formBody(request) {
  return new Promise((resolve, reject) => {
    let body = [];
    let totalSize = 0;

    if (request.headers['content-type'] !== 'application/x-www-form-urlencoded') {
      request.destroy(); // Abort the request when the Content-Type check fails
      reject(new RequestBodyParsingError('Invalid Content-Type. Expected application/x-www-form-urlencoded.'));
      return;
    }

    request.on('data', (chunk) => {
      body.push(chunk);
      totalSize += chunk.length;

      if (totalSize > MAX_BODY_SIZE) {
        request.destroy(); // Abort the request when the size limit is exceeded
        throw new RequestBodyParsingError('Request body size limit exceeded.');
      }

    }).on('end', () => {
      body = querystring.parse(Buffer.concat(body).toString());
      resolve(body);

    }).on('error', (e) => {
      reject(e);
    });
  });
}
