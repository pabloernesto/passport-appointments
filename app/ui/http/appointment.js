import { formBody, HTMLWrap} from '../../lib/http/util-request.js';

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
    res.end(
      (!appt.err && appt.val !== "In queue.") ? render(body, appt.val)
      : (!appt.err && appt.val === "In queue.") ? renderQueued(body)
      : (appt.err?.message === "User already in queue.") ? renderAlreadyQueue(body)
      : renderFatalError(body, appt.err)
    );
    return true;
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
