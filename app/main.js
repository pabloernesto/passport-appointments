import showHomePage from './request-handlers/homepage.js';
import show404 from './request-handlers/404.js'
import http from 'http';
import sqlite3 from 'sqlite3';
import getAppointment from './request-handlers/appointment.js';

//const hostname = '127.0.0.1';
const hostname = '0.0.0.0';
const port = 3000;

function route(req, res) {
  const { method, url } = req;
  if (method === "GET" && ["/", "/index.html"].includes(url))
    getAppointment(req, res, db);
  else
    show404(req, res, db);
}

const server = http.createServer(route);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});



// database base code
const db = new sqlite3.Database(':memory:');

/* split table creation/initialization and run inside serialize to prevent
  insertions from encountering a missing table */
db.serialize(() => {
  db.run(`create table counters (
    name primary key,
    value
  );`)
  .run(`insert into counters (name, value)
    values ("accesses", 0);`)
  .run(`create table users (
    user_id primary key,
    passport int
  );`)
  .run(`insert into users (user_id, passport)
    values (69, 420);`
  );
});
