# passport-appointments
Idea: one-up [SAIME](https://siic.saime.gob.ve/).

Appointment slots are limited and released in unpredictable batches, usually every few months.
Instead of making people wait/guess on the site, set them up for a queue.

**Contents**
1. [Design principles](docs/design-principles.md)
1. [Technical notes](docs/technical-notes.md)
1. [References](docs/refences.md)

# Running the project
- launch with `npm start`
- run tests with `npm test`

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
- ~~do a login~~
- admin interface
  - Admin appointment slots
  - Admin appointment slots web interface
- embassies
- Appointment queue
  - When user tries to make an appointment and there are no slots, they are added to a database
  - The user is told they were added to the queue
  - The user can GET /appointments to see their appointment status
  - The user receives an email when they have an appointment (stretch)
  - Test multiple users at a time
  - Users can see where they are in the queue (two significant figures)
  - Admin can see the queue
  - Don't give out appointments less than one week away
- Rethink page flow (Mafer doesn't like it, I think it's ok)
- Cancel appointment
- Leave appointment queue
- Email everything that isn't the appointment
- Prettify CSS (low urgency, low importance)


[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
