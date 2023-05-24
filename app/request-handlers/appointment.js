export default function getAppointment(req, res, db) {
  res.statusCode = 200;
  db.get(
    `select user_id from users`,
    (err, row) => {
      if (err !== null) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`Error: ${JSON.stringify(err)}`);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`This page has been accessed ${row.user_id}`);

      }
    }
  );
}
