export default function showHomePage(req, res, db) {
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
