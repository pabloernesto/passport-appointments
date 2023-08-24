# Preamble
Run `npm start` from project root.

# As new user
Launch a new Firefox private window (`./scripts/firefox-tmp-profile.sh`).
Navigate to `/appointments`.
Click "Register".
Register as "Jim", "jim@example.com", "1234".
Input "Jim" and "jim@example.com", then click "Request appointment".

If you are presented the message:
"Jim, there are no appointments currently available. You have been added to the queue."
the test passes.
