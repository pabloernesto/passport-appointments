import { DrawPageWithBody } from '../../lib/http/util-request.js';
import querystring from 'node:querystring';

export default class AppointmentsMW {
  constructor(model) {
    this._model = model;
  }
  /*
    requests an appointment for the user in the form.
    If there are no appointment slots avilable, it will add the user to a queue.
    The user will be shown an error message if:
      - the user is successfully queued.
      - the queueing fails, assuming it's because the user is already in the queue.
      - An error occured while requesting the appointment - for example, a nonexistent user.
  */
  async respond(req, res, ctx) {
    // Using POST-REDIRECT-GET pattern
    const { method, url } = req;
    let clean_url = url.split('?')[0];
    let late_url = url.split('?')[1];
    let body;
    // handle passport check status
    if (method === "POST" && clean_url === "/appointment") {
      const appt = await this._model.requestAppointment(ctx.user);
      res.statusCode = 200;

      if(!appt.err && appt.val !== "In queue.") {
        body = render(ctx.user, appt.val);
      }else if (!appt.err && appt.val === "In queue.") {
        body = renderQueued(ctx.user);
      } else if (appt.err?.message === "User already in queue.") {
        body = renderAlreadyQueue(ctx.user);
      } else {
        res.statusCode = 500;
        body = renderFatalError(ctx.user, appt.err);
      }

      res.end(DrawPageWithBody(body, ctx));
      return true;
    } else if (clean_url === "/appointment-result") {
      res.statusCode = 200;
      res.end();
      return true;
    } else if (method === "GET" && clean_url == "/appointment-status") {
      res.statusCode = 200;
      const appt = await this._model.getAppointment(ctx.user);
      if(appt.val) {
        body = renderSuccessfulCheck(appt.val.user, appt.val.date);
      } else {
        const in_q = await this._model._database._userIsInQueue(ctx.user);
        if(in_q) {
          let ahead = await this._model._database.totalUsersAheadOf(ctx.user);
          body = renderQueueStatus(ctx.user, ahead.val);
        } else {
          body = "Sorry, you have no appointments at this time and you are not in the queue.";
        }
      }
      res.end(DrawPageWithBody(body, ctx));
      return true;
    }
    return false;
  }
}

// TODO: handle pending appointments
function render(user, appointment) {
  return `<p>${ user }, you have your appointment at ${ appointment }.</p>`;
}

function renderQueued(user) {
  return `<p>${ user }, there are no appointments currently available. You have been added to the queue.</p>`;
}

function renderAlreadyQueue(user) {
  return `<p>${ user }, you are already in the queue.</p>`;
}

function renderFatalError(user, err) {
  return `\
<p>${ user }, a server error occured while adding your appointment.</p>
<pre>${ JSON.stringify(err) }</pre>
`
}

function renderSuccessfulCheck(user, date) {
  return `<p>Congratulations, ${user}, you have an appointment for: ${date}</p>`;
}

function renderQueueStatus(user, ahead) {
  if(ahead == null || !user) {
    return generalError(user);
  }
  return `<p>User, you are currently waiting in the queue. There are ${ahead} users waiting ahead of you.</p>`;
}

function generalError(user) {
  return `<p>User, there was a server error.</p>`;
}