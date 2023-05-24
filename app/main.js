const http = require('http');

//const hostname = '127.0.0.1';
const hostname = '0.0.0.0';
const port = 3000;

function showHomePage(req, res) {
  res.statusCode = 200;
  db.get(
    `update counters
      set value = value + 1
      where name = 'accesses'
      returning value`,
    (err, row) => {
      if (err !== null) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`Error while updating counter: ${JSON.stringify(err)}`);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`This page has been accessed ${row.value} time${row.value == 1 ? "" : "s"}`);
    }
  );
}

function show404(req, res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end("404 error. This page does not exist.");
}

function route(req, res) {
  const { method, url } = req;
  if (method === "GET" && ["/", "/index.html"].includes(url))
    showHomePage(req, res);
  else
    show404(req, res);
}

const server = http.createServer(route);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});



// database base code

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

/* split table creation/initialization and run inside serialize to prevent
  insertions from encountering a missing table */
db.serialize(() => {
  db.run(`create table counters (
    name primary key,
    value
  );`)
  .run(`insert into counters (name, value)
    values ("accesses", 0);`
  );
});
