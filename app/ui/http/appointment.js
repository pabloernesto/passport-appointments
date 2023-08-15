import { formBody, HTMLWrap} from '../../lib/http/util-request.js';
import querystring from 'node:querystring';

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
    // Using POST-REDIRECT-GET pattern
    const { method, url } = req;
    let clean_url = url.split('?')[0];
    let late_url = url.split('?')[1];
    // handle passport check status
    if (method === "POST" && clean_url === "/appointment") {
      // TODO: make auth middleware hide token -> user mapping.
      const body = await this._formBody(req);
      const user = body.userid;
      const appt = await this._model.requestAppointment(user);

      res.statusCode = 200;
      if(!appt.err && appt.val !== "In queue.") {
        res.end(render(user, appt.val));
      }else if (!appt.err && appt.val === "In queue.") {
        res.end(renderQueued(body));
      } else if (appt.err?.message === "User already in queue.") {
        res.end(renderAlreadyQueue(body));
      } else {
        res.statusCode = 500;
        res.end(renderFatalError(body, err));
      }
      return true;
    } else if (clean_url === "/appointment-result") {
      res.statusCode = 200;
      res.end();
      return true;
    }
    return false;
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
