export default (username) =>
  !username ? '<div class="login-status"><a href="/login">Login</a></div>'
  : `\
<div class="login-status">
  <p>${ username }</p>
  <a href="/logout">Logout</a>
</div>`;
