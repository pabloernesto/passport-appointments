# Preamble
Run `npm start` from project root.

# As new user
Launch a new Firefox private window (`./scripts/firefox-tmp-profile.sh`).
Click "Get an appointment."
Click "Register".
Register as "Jim", "jim@example.com", "1234".
If you are not at `/appointments`, the test fails.
Close Firefox.

# As existing user
Launch a new Firefox private window.
Click "Get an appointment."
Login as "Jim", "1234".
If you are not at `/appointments`, the test fails.

Otherwise, the test passes.
