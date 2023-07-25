```js
class Appointments {
  constructor(storage) {
    this.storage = storage;
  }



  /* appointments */

  // create
  requestAppointment(user) {}

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



Authentication as a library
```js
class Authentication {
  constructor(storage) {
    this.storage = storage;
  }

  // create
  createUser(user, email, password) {}

  // read
  authenticate(user, password) {} // returns token or undefined (throws?)
  isValidToken(token) {}
  getTokenRecord(token) {}

  // update
  updateUser(user, { newuser, newemail, newpassword }) {}

  // delete
  invalidateToken(token) {}
}
```



Authorization as a library
```js
class Authorization {
  constructor(storage) {
    this.storage = storage;
  }

  isAuthorized(user, action) {
    const rules = this.storage.iterateRules();
    let history = [];
    let last;
    for (rule of rules) {
      last = {
        rulename: rule.name,
        // rules must be executable
        result: rule.apply(user, action, history)
      };
      history.push(last);
      if (last.result !== undefined)
        break;
    }
    return { value: last.result, history };
  }

  addRule(rule) {
    // rules must be serializable
    this.storage.addRule();
  }

  getRules() {
    return this.storage.getRules();
  }

  deleteRule(rule) {
    // rules must support equality
    this.storage.deleteRule()
  }
}
```



Secure appointments
```js
class SecureAppointments {
  constructor(appointments, authentication, authorization) {
    this._appointments = appointments;
    this._authentication = authentication;
    this._authorization = authorization;
  }



  /* appointments */

  // create
  requestAppointment(token) {
    if (!this._authentication.isValidToken(token))
      throw new Error('Invalid Token');

    const { user } = this._authentication.getTokenRecord(token);
    const action = {
      name: 'requestAppointment',
      params: [ user ]
    };
    if (!this._authorization.isAuthorized(user, action))
      throw new Error('Unauthorized');

    this._appointments.requestAppointment(...params);
  }

  // read
  getAppointment(token) {}

  // update

  // delete
  cancelAppointment(token) {}



  /* administration */

  // create
  createAppointments(token, appointments) {}

  // read
  getAppointments(token) {}

  // update
  freezeAppointments(token, frozen) {} // takes boolean

  // delete
  deleteAppointments(token, appointments) {}
}
```
