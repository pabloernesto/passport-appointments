# passport-appointments
Idea: one-up [SAIME](https://siic.saime.gob.ve/).

Appointment slots are limited and released in unpredictable batches, usually every few months.
Instead of making people wait/guess on the site, set them up for a queue.

## Design principles
1. As a goverment website, imposing unnecessary difficulty is wrong
  - Make the whole process quick and painless
  - Don't discriminate against older people
1. As a goverment website, accessibility is paramount
  - Mobile first
  - Compatibility with older browsers
  - Compatibility with lots of browser vendors
  - Screen reader accessible
  - Keyboard accessible
  - Accessible with JavaScript disabled
1. We don't want to pay for hosting (because we're broke)
  - Keep it light on the backend
  - Not using frameworks (e.g. Express)

## Reference material
- De Tour con Gus. [DESCUBRE EL SECRETO PARA AGENDAR CITA EN SAIME PARA PASAPORTE][gus-2023]. 2023.

[gus-2023]: https://www.youtube.com/watch?v=eMAREtM5IWI

# Requirements
The user can get an appointment at an embassy to request a passport.
If passport dates are available the system assigns the user an appointment immediately.
Because forcing people to rush would be bad, the system doesn't give out appointments less than one week (variable?) into the future.

If passport dates are not available, the user will be added to a queue, and assigned a date in order of arrival.

Appointments and queues are separate by embassy.

Users should be able to leave the queue or cancel their appointments.

Users should be able to see how many people are in the queue (in front of them and maybe behind?).
Counts should be precise to two significant figures.

As a safety mechanism, all actions will be confirmed through email.
When a user is assigned an appointment, they receive a confirmation mail.
When a user is queued up, they receive a confirmation mail.
When a user cancels their appointment, they receive a confirmation mail.
When a user leaves the queue, they receive a confirmation mail.

As a stretch goal:  
Users are able to declare a date-time preference (monday morning, tuesday afternoon, etc).
When a batch of appointments is released, the system will attempt to fulfill as many people's preferences as it can.

# Priorities
- ~~test out serving websites from node~~
- ~~test out getting data from SQLite~~
- ~~test out making a dynamic page with node~~
- ~~automatically serve static files~~
- ~~skeleton request~~
- ~~research: date-handling in Node~~ uses js-native [Date objects][date]
- ~~keep html templates away from response code: move to render function~~
- ~~parse form data in HTTP POST requests~~
- ~~hide database behind interface object~~
- do a login
- research: how does sql work?

[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

# Prototypes
## Part one
- Three views: homepage, request ID, display appointment
- Request ID: single numerical entry of exactly 8 digits, otherwise reject
- No interaction with database
- appointment generator does not handle concurrency, but it does take the ID as argument
- Appointment is some valid date and time

### Part one point five
- Database: store ID, appointment pairs in real database

# Style notes
- indent with 2 spaces

# Technical notes
We're building this in Node.js v18.16.0 LTS so we can share code between front and backend, should we need to.

Start the project with `node run start`.

SQLite3 for the database via the `sqlite3` npm package.

nginx?

# hexagonal
The project is organized like this:

- There is a model folder, which contains the logic of the app, independent of implementation detail.
- For each port of the app, there is a folder for that port.
- For every adapter to a port, there is a subfolder in the port's folder, containing the code for that adapter.
- There is a 'lib' folder for code that is implementation detail but shared between adapters.
- main.js is the start point. Hooks up concrete runtime implementation of our code. (Which modules are on and off?)
## Tests

run with
node --experimental-vm-modules node_modules/jest/bin/jest.js

### Test framework
https://jestjs.io/docs/ecmascript-modules
