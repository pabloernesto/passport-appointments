# Style guide
- indent with 2 spaces
- structure the project according to [hexagonal architecture][]

[hexagonal architecture]: hexagonal.md

# Stack choice and dependencies

## Stack
We're building this in Node.js v18.16.0 LTS so we can share code between front and backend, should we need to.

## Dependencies

- `sqlite3`: database management
  - https://www.npmjs.com/package/sqlite3
  - https://github.com/TryGhost/node-sqlite3/wiki/API
  - https://www.sqlite.org
- `jest`: javascript unit test harness
  - https://jestjs.io/
- `fecha`: date parsing and formatting
  - https://github.com/taylorhakes/fecha
  - rationale [as stackoverflow answer][so-fecha]

[so-fecha]: https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
