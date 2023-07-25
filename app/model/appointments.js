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
        await this._database.createAppointment(user);

        let db_object = await this._database.fetchAppointment(user);
        return db_object.date;
      } else {
        throw Error("Already has appointment");
      }
    } else {
      throw Error("No such user :/");
    }
    
  }

  // read
  async getAppointment(user) {
    const has = await this._database.hasUser(body);
    if(has) {
      const appt = await this._database.hasAppointment(body.userid);
      if(!appt) {
        console.log("No appointment");
      }
      return
    }
    throw Error("No such user exists!");
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
