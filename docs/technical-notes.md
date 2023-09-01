# Style guide
- indent with 2 spaces
- structure the project according to [hexagonal architecture][]

[hexagonal architecture]: hexagonal.md

# Stack choice and dependencies

## Stack
We're building this in Node.js v18.16.0 LTS so we can share code between front and backend, should we need to.

## Dependencies

- `better-sqlite3`: database management
  - https://github.com/WiseLibs/better-sqlite3
  - https://www.npmjs.com/package/better-sqlite3
  - [*Convince me to use better-sqlite3*](https://github.com/WiseLibs/better-sqlite3/issues/262). better-sqlite3 issue 262
- `jest`: javascript unit test harness
  - https://jestjs.io/
- `fecha`: date parsing and formatting
  - https://github.com/taylorhakes/fecha
  - rationale [as stackoverflow answer][so-fecha]
- `normalize.css`: consistent cross-browser defaults
  - https://necolas.github.io/normalize.css/

[so-fecha]: https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
