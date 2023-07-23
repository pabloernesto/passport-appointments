export default class http404MW {
  respond(req, res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end("404 error. This page does not exist.");
    return true;
  }
}
