const adminEndpoints = [ '/admin' ];

export default class AuthenticationMW {
  constructor(database) {
    this._database = database // TODO: replace with implementation object
  }

  respond(req, res) {
    if(adminEndpoints.includes(req.url)) {
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
  <p>This is a super secret admin page.</p>
</body>
</html>`);
      return true;
    }
    return false;
  }
    
}
