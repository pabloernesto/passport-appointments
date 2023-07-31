import fecha from 'fecha'
export default class Appointments {
  constructor(database) {
    this._database = database;
  }


  /* appointments */

  async findOpenAppointmentFor(user) {
    this._database.getNearestAppointmentSlot()
    return fecha.format(Date.now(),  'YYYY-MM-DD HH:mm:ss');
  }

  // create
  async requestAppointment(user) {
    const has = await this._database.hasUser( { user_id: user} );
    if(!has) throw Error("No such user :/");

    const appt = await this._database.hasAppointment(user);
    if(appt) throw Error("Already has appointment");

    await this._database.createAppointment(user, await this.findOpenAppointmentFor(user));

    let db_object = await this._database.fetchAppointment(user);
    if (db_object && db_object.date) 
      return new String(db_object.date);
    else  
      throw Error("Could not create appointment");
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
