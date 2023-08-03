import {adminEndpoints, loggedInEndpoints} from './const.js';

export default class AuthenticationMW {
  constructor(database) {
    this._database = database // TODO: replace with implementation object
  }

  respond(req, res) {
    if(req.url == "/admin") {
      res.end(`\
<!DOCTYPE html>
<html lang="en" class="booting">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Admin tab</title>

  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <!-- <link rel="icon" href="favicon.ico" type="image/x-icon" /> -->
  <!-- <meta name="description" content="blurb for google search" />  -->
  <!-- <link rel="canonical" href="www.mysite.com/index.html" > -->

  <!-- <link rel="stylesheet" href="my-css-file.css" /> -->
  <!-- <script src="main.js" module></script> -->
</head>
<body>
  <form method="POST" action="/single_slot">
    <label for="single_slot">Add single appointment slot (date and time):</label>
    <input type="datetime-local" id="single_slot" name="single_slot"> 
    <button>Add new slot</button>
  </form>
</body>
</html>`);
      return true;
    } else if (req.url == "/single_slot") {
      res.end(`\
<!DOCTYPE html>
<html lang="en" class="booting">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Admin tab</title>

  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <!-- <link rel="icon" href="favicon.ico" type="image/x-icon" /> -->
  <!-- <meta name="description" content="blurb for google search" />  -->
  <!-- <link rel="canonical" href="www.mysite.com/index.html" > -->

  <!-- <link rel="stylesheet" href="my-css-file.css" /> -->
  <!-- <script src="main.js" module></script> -->
</head>
<body>
  <form method="POST" action="/single_slot">
    <label for="single_slot">Add single appointment slot (date and time):</label>
    <input type="datetime-local" id="single_slot" name="single_slot"> 
    <button>Add new slot</button>
    <label>Success!</label>
  </form>
</body>
</html>`);
      return true;
      
    }
    return false;
  }
    
}
