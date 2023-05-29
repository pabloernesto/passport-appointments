function match(req) {
  const { method, url } = req;
  return method === "POST" && url === "/appointment";
}

function formBody(req) {
  return new Promise((resolve, reject) => {
    // your code goes here
    // when you get the data, call resolve(data)
    // if you encounter an error, call reject(error)
    resolve({ userid: 123 });
  });
}

async function respond(req, res, db) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  const body = await formBody(req);
  res.end(`\
<!DOCTYPE html>
<html lang="en" class="booting">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your appointment is ready</title>

  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <!-- <link rel="icon" href="favicon.ico" type="image/x-icon" /> -->
  <!-- <meta name="description" content="blurb for google search" />  -->
  <!-- <link rel="canonical" href="www.mysite.com/index.html" > -->

  <!-- <link rel="stylesheet" href="my-css-file.css" /> -->
  <!-- <script src="main.js" module></script> -->
</head>
<body>
  <p>User ${ body.userid }, you have your appointment.<p/>
</body>
</html>`
  );
}

export default { match, respond };
