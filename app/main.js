import route_appointment from './request-handlers/appointment.js';
import route_static from './request-handlers/static.js';
import route_404 from './request-handlers/404.js';

import http from 'http';
import { database } from './request-handlers/database-wrapper.js';

//const hostname = '127.0.0.1';
const hostname = '0.0.0.0';
const port = 3000;

const routes = [
  route_appointment,
  route_static,
  route_404,
];

function route(req, res) {
  for (const { match, respond } of routes) {
    if (match(req)) {
      respond(req, res, database);
      // TODO: add support for middleware that doesn't capture the req, eg redirects
      break;
    }
  }
}
const server = http.createServer(route);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});



database.initialize();