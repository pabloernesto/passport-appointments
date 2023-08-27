# Preamble
Run `npm start` from project root.
Launch a new Firefox private window (`./scripts/firefox-tmp-profile.sh`).
Click "Get an appointment."
Click "Register".
Register as "Jim", "jim@example.com", "1234".

Click logout.
If you are not presented with a logged out interface, the test fails.

Open the Firefox developer tools, storage tab.
Examine the cookies.
If the session cookie is still present, the test fails.

Click "Get an appointment."
If you are not redirected to `/login`, the test fails.

Otherwise, the test passes.
