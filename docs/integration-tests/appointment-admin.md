Run `npm start` from project root.

Launch a new Firefox private window (`./scripts/firefox-tmp-profile.sh`).
Click on "Get an appointment".
Login as "Wonder Woman", "1234".

If you are not presented the message:
"You are not authorized to use this site functionality"
the test fails.

Click on "Go to admin section".
If you are not at `/admin`, the test fails.

Otherwise, the test passes.
