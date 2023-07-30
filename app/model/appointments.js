export default class Appointments {
  constructor(database) {
    this._database = database;
  }

  /* appointments */

  // create
  async requestAppointment(user) {
    const has = await this._database.hasUser( { user_id: user} );
    if(has) {
      const appt = await this._database.hasAppointment(user);
      if(!appt) {
        await this._database.createAppointment(user, "1999-10-10 00:00:00");

        let db_object = await this._database.fetchAppointment(user);
        return new String(db_object.date);
      } else {
        throw Error("Already has appointment");
      }
    } else {
      throw Error("No such user :/");
    }
    
  }

  // read
  async getAppointment(user) {
    return this._database.fetchAppointment(user);
  }

  // update

  // delete
  async cancelAppointment(user) {}



  /* administration */

  // create
  async createAppointments(appointments) {} // takes [ [date, number_of_slots]... ]

  // read
  async getAppointments() {}

  // update
  async freezeAppointments(frozen) {} // takes boolean

  // delete
  async deleteAppointments(appointments) {}
}
