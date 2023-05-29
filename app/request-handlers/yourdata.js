function match(req) {
  const { method, url } = req;
  return method === "GET" && ["/", "/index.html"].includes(url);
}

function respond(req, res, db) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(`\
<!DOCTYPE html>
<html lang="en" class="booting">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Argenzuela</title>

  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <meta name="description" content="Una solución argentina para los problemas venezolanos." />

  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <h1>Argenzuela</h1>
  <p>This is a website.</p>
</body>
</html>
`
  );
}

export default { match, respond };
