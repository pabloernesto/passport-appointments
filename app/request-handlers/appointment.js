import { database } from '../database-wrapper.js';
import { formBody } from '../util-request.js';

function match(req) {
  const { method, url } = req;
  return method === "POST" && url === "/appointment";
}

async function getAppointment(body, database) {
  // TODO: put this logic in separate login code
  const has = await database.hasUser(body);
  if(!has) {
    console.log("creating user...");
    database.addUser(body);
  }
  const appt = await database.hasAppointment(body.userid);
  if(appt) {
    console.log("fetching appointment...");
    return database.fetchAppointment(body);
  } else {
    console.log("creating appointment...");
    return database.createAppointment(body);
  }
}

async function respond(req, res, db) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  const body = await formBody(req);
  const appointment = await getAppointment(body, db)
    .catch(
      (reason) => console.log(reason));
  print("Hello");
  res.end(render(body, db, appointment));
}

function render(body, db, appointment) {
  return `\
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
  <p>User ${ body.userid }, you have your appointment at ${ appointment }.<p/>
</body>
</html>`
}

export default { match, respond };
