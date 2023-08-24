# Preamble
Run `npm start` from project root.

# As new user
Launch a new Firefox private window (`./scripts/firefox-tmp-profile.sh`).
Navigate to `/appointments`.
Click "Register".
Register as "Jim", "jim@example.com", "1234".
If you are not at `/appointments`, the test fails.
Close Firefox.

# As existing user
Launch a new Firefox private window.
Navigate to `/appointments`.
Login as "Jim", "1234".
If you are not at `/appointments`, the test fails.

Otherwise, the test passes.
