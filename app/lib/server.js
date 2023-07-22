import http from 'http';

export default class Server {
  constructor() {
    this._middleware = [];
    this._http = http.createServer(route);
  }

  add_middleware(handler) {
    this._middleware.push(handler);
  }

  listen(hostname, port) {
    this._hostname = hostname;
    this._port = port;
    this._http.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
    });
  }
}

async function route(req, res) {
  for (const handler of this._middleware) {
    const is_captured = await handler(req, res);
    if (is_captured)
      break;
  }
}
