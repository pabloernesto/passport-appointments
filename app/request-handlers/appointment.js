import querystring from 'node:querystring';
import { database } from './database-wrapper.js';
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
      body = querystring.parse(body);
      console.log(body);
      resolve(body)
    }).on('error', (e) => {
      reject(e);
    });
  });
}

function getAppointment(body) {
  if(database.hasAppointment(body)) {
    return database.fetchAppointment(body);
  } else {
    return database.createAppointment(body);
  }
}

async function respond(req, res, db) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  const body = await formBody(req);
  res.end(`\
<!DOCTYPE html>
<html lang="en" class="booting">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your appointment is ready</title>

  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <!-- <link rel="icon" href="favicon.ico" type="image/x-icon" /> -->
  <!-- <meta name="description" content="blurb for google search" />  -->
  <!-- <link rel="canonical" href="www.mysite.com/index.html" > -->

  <!-- <link rel="stylesheet" href="my-css-file.css" /> -->
  <!-- <script src="main.js" module></script> -->
</head>
<body>
  <p>User ${ body.userid }, you have your appointment at ${getAppointment(body)}.<p/>
</body>
</html>`
  );
}

export default { match, respond };
