export default class Appointments {
  constructor(database) {
    this._database = database;
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
