import { formBody } from '../../lib/http/util-request.js';

export default class AppointmentsMW {
  constructor(model) {
    this._model = model;
    this._formBody = formBody;
  }
  /*
    requests an appointment for the user in the form.
    If there are no appointment slots avilable, it will add the user to a queue.
    The user will be shown an error message if:
      - the user is successfully queued.
      - the queueing fails, assuming it's because the user is already in the queue.
      - An error occured while requesting the appointment - for example, a nonexistent user.
  */
  async respond(req, res) {
    const { method, url } = req;

    // only handle POSTs to /appointment
    if(!(method === "POST" && url === "/appointment"))
      return false;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');

    // TODO: make auth middleware hide token -> user mapping.
    const body = await this._formBody(req);
    const user = body.userid;

    const appt = await this._model.requestAppointment(user);
    if (!appt.err) {
      res.end(render(body, appt.val));
      return true;

    } else if (appt.err.message !== "No slots available.") {
      res.end(renderFatalError(body, appt.err));
      return true;
    }

    const queued = await this._model.queueUserForAppointment(user);
    if (!queued.err) {
      res.end(renderQueued(body));
      return true;

    } else if (queued.err.message === "User already in queue.") {
      res.end(renderAlreadyQueue(body));
      return true;

    } else {
      res.end(renderFatalError(body, queued.err));
      return true;
    }
  }
}

// TODO: handle pending appointments
function render(body, appointment) {
  let text = `<p>${ body.userid }, you have your appointment at ${ appointment }.</p>`;
  return HTMLWrap(text);
}

function renderQueued(body) {
  let text = `<p>${ body.userid }, there are no appointments currently available. You have been added to the queue.</p>`;
  return HTMLWrap(text);
}

function renderAlreadyQueue(body) {
  let text = `<p>${ body.userid }, you are already in the queue.</p>`;
  return HTMLWrap(text);
}

function renderFatalError(body, err) {
  return HTMLWrap(`\
<p>${ body.userid }, an server error occured while adding your appointment.</p>
<pre>${ JSON.stringify(err) }</pre>
`);
}

function HTMLWrap(text) {
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
    ${ text }
  </body>
  </html>`;
}