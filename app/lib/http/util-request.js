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

export function HTMLWrap(text, title="") {
  return `\
  <!DOCTYPE html>
  <html lang="en" class="booting">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  
    <link rel="icon" href="data:;base64,iVBORw0KGgo=">
    <!-- <link rel="icon" href="favicon.ico" type="image/x-icon" /> -->
    <!-- <meta name="description" content="blurb for google search" />  -->
    <!-- <link rel="canonical" href="www.mysite.com/index.html" > -->
  
    <link rel="stylesheet" href="/normalize.css.v8.0.1.css" />
    <link rel="stylesheet" href="/style.css" />
    <!-- <script src="main.js" module></script> -->
  </head>
  <body>
    <header>
      <a href="/" class="header--logo">
        <img src="/venezuela-banner-brush.png" width="200px" alt="Inicio">
      </a>
      <h1 class="header--title">passport-appointments</h1>
    </header>
    <main class="main-column">
      ${ text }
    </main>
  </body>
  </html>`;
}