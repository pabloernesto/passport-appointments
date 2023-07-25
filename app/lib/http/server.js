import http from 'http';

export default class Server {
  constructor() {
    this._middleware = [];
    this._http = http.createServer((req, res) => this._route(req, res));
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

  async _route(req, res) {
    for (const m of this._middleware) {
      const is_captured = await m.respond(req, res);
      if (is_captured)
        break;
    }
  }
}
