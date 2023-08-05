import { formBody } from '../../lib/http/util-request.js';
const QUEUED = 68;
export default class AppointmentsMW {
  constructor(model) {
    this._model = model;
  }

  async respond(req, res) {
    const { method, url } = req;

    if (method === "POST" && url === "/appointment") {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      const body = await formBody(req);
      // TODO: make auth middleware hide token -> user mapping.
      const user = body.userid;
      let appointment;
      try {
        appointment = await this._getAppointment(user);
      } catch(error) {
        if(error.message == "No appointment available"){
          try {
            await this._model.queueUserForAppointment(user);
          } catch(error) {
            console.log(error);
          } finally {
            appointment = QUEUED;
          }
        } else {
          console.log(error);
        }
      }
      if(appointment == QUEUED) {
        res.end(renderQueued(body));
      } else if(appointment) {
        res.end(render(body, appointment));
      } else {
        res.end(renderAlreadyQueue(body));
      }
      return true;
    }

    return false; // ignore request
  }

  async _getAppointment(user) {
    return await this._model.requestAppointment(user);
  }
}

// TODO: handle pending appointments
function render(body, appointment) {
  let text = appointment ? `<p>${ body.userid }, you have your appointment at ${ appointment }.</p>` : `<p>No appointment slots are available.</p>`
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