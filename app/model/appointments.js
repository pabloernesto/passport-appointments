import fecha from 'fecha'
export default class Appointments {
  constructor(database) {
    this._database = database;
  }

  /* appointments */

  async findOpenAppointmentFor(user) {
    let nearest = await this._database.getNearestAppointmentSlot();
    return nearest ? nearest.date : undefined;
  }

  // create
  async requestAppointment(user) {
    const has = await this._database.hasUser( { user_id: user} );
    if(!has) throw Error("No such user");

    const appt = await this._database.hasAppointment(user);
    if(appt) throw Error("Already has appointment");

    let date = await this.findOpenAppointmentFor(user);
    if(!date) {
      throw Error("No appointment available");
    }
    await this._database.createAppointment(user, date);

    let db_object = await this._database.fetchAppointment(user);
    if (db_object && db_object.date) 
      return new String(db_object.date);
    else  
      throw Error("Could not create appointment");
  }

  async queueUserForAppointment(user) {
    try {
      await this._database.addUserToQueue(user);
    } catch(e) {
      throw Error("Could not queue user for appointment");
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
  async createAppointments(dates) {
    /*
      dates: list of js DateTime object, UTC
      TODO: take multiple dates or maybe a custom appt object
    */
    // check 1 week from current time
    let date = fecha.format(dates[0], 'YYYY-MM-DD HH:mm:ss')
    await this._database.createAppointmentSlot(date);
  } // takes [ [date, number_of_slots]... ]

  // read
  async getAppointments() {}

  // update
  async freezeAppointments(frozen) {} // takes boolean

  // delete
  async deleteAppointments(appointments) {}
}
