```js
class Appointments {
  constructor(storage) {
    this.storage = storage;
  }



  /* appointments */

  // create
  requestAppointment() {}

  // read
  getAppointment(user) {}

  // update

  // delete
  cancelAppointment(user) {}



  /* administration */

  // create
  createAppointments(appointments) {} // takes [ [date, number_of_slots]... ]

  // read
  getAppointments() {}

  // update
  freezeAppointments(frozen) {} // takes boolean

  // delete
  deleteAppointments(appointments) {}
}
```



Manual Authentication
```js
class SecureAppointments {
  constructor(appointments, storage) {
    this.appointments = appointments;
    this.storage = storage;
  }



  /* authentication */

  // create
  createUser(user, email, password) {}

  // read
  authenticate(user, password) {} // returns token or undefined (throws?)
  isValidToken(token) {}

  // update
  changeMail(user, new_email) {}

  // delete
  userFromToken(token) {}
  invalidateToken(token) {}



  /* appointments */

  // create
  requestAppointment(token) {}

  // read
  getAppointment(token) {}

  // update

  // delete
  cancelAppointment(token) {}



  /* administration */

  // create
  createAppointments(token, appointments) {} // takes [ [date, number_of_slots]... ]

  // read
  getAppointments(token) {}

  // update
  freezeAppointments(token, frozen) {} // takes boolean

  // delete
  deleteAppointments(token, appointments) {}
}
```



Automatic Authentication
```js
class AuthDecorator {
  constructor(base) {
    this.base = base;
    AuthDecorator.decorate(this, base);
  }



  /* authentication */

  // create
  createUser(user, email, password) {}

  // read
  authenticate(user, password) {} // returns token or undefined (throws?)
  isValidToken(token) {}

  // update
  changeMail(user, new_email) {}

  // delete
  userFromToken(token) {}
  invalidateToken(token) {}



  /* metaprogramming */
  static decorate(decorator, base) {
    Object.entries(base)
    .filter(([ prop, value ]) => typeof value === 'function')
    .map(([ prop, f ]) => [ prop, AuthDecorator.wrapCall(f, decorator, base) ])
    .forEach(([ prop, f ]) => {
      if (decorator[prop])
        throw new Error(`Decorator has property ${ prop }`);
      decorator[prop] = f;
    });
  }

  static wrapCall(f, decorator, base) {
    return (token, ...args) =>  {
      if (!decorator.isTokenValid(token))
        throw new Error('Invalid token');
      return f.apply(base, args);
    }
  }
}
```

Problem: `AuthDecorator` checks the user is authenticated (ie logged in),
_not_ if they have permission to run a particular request.
There is no way to say "users can cancel appointments, but only for themselves".
