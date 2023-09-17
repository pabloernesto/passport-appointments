import { formBody } from './util-request.js';

export default class FormBodyMW {
  async respond(req, res, ctx) {
    if (hasFormBody(req)) {
      ctx.body = await formBody(req);
    }
    return false;
  }
}

function hasFormBody(req) {
  return (
    req.method === 'POST'
    && req.headers['content-type'] === 'application/x-www-form-urlencoded'
  )
}
