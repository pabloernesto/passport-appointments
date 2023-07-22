function respond(req, res, db) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end("404 error. This page does not exist.");
}
function match(req) {
  return true;
}

export default {
  match,
  respond
}