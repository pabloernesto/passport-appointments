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

      res.statusCode = 303;
      let handler;
      let meta;
      let error = "";
      if(!appt.err && appt.val !== "In queue.") {
        handler ='appt-render';
      }else if (!appt.err && appt.val === "In queue.") {
        handler ='appt-queued';
      } else if (appt.err?.message === "User already in queue.") {
        handler = 'appt-already-queued';
      } else {
        handler ='appt-fatal';
        error = "Server error";
      }
      
      meta = querystring.stringify({"handler": handler, userid: user, appt: appt.val, error: error});
      res.setHeader('Location', '/appointment-check?'+ meta);

      res.end();
      return true;

      // handle redirects
    } else if ((method === 'GET') && (clean_url === "/appointment-check")) {
      if(!late_url) return false;
      let qs = querystring.parse(late_url);
      if(qs == {}) return false;
      if(qs.handler == 'appt-render') {
        res.statusCode = 200;
        res.end(render({userid: qs.userid}, qs.appt));
      } else if('appt-queued') {
        res.statusCode = 200;
        res.end(renderQueued({userid: qs.userid}));
      } else if('appt-already-queued') {
        res.statusCode = 200;
        res.end(renderAlreadyQueue({userid: qs.userid}));
      } else {
        res.statusCode = 500;
        res.end(renderFatalError({userid: qs.userid}));
      }
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
