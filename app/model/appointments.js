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

  /*
  */
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

  /*
    TODO: untested
    Creates appointment slots based on the provided date list.
    If auto_assign = true, assigns min(#slots, #users)
  */
  async createSlots(dates, auto_assign = true) {
    /*
      dates: list of js DateTime object, UTC
      TODO: take multiple dates or maybe a custom appt object
    */
    // check 1 week from current time
    let date = fecha.format(dates[0], 'YYYY-MM-DD HH:mm:ss')
    await this._database.createAppointmentSlot(date);
    if(auto_assign) {
      await this.autoAssignUsers();
    }
  } // takes [ [date, number_of_slots]... ]

  // TODO untested
  async autoAssignUsers() {
    let _break = false;
    let appointment;
    while (_break) {
      let user = await this._database.getFirstUserInQueue()
      .catch((reason) => {
        _break = true;
      }).then(async () => 
       appointment = await this.requestAppointment(user)
      ).catch(() => {
        // TODO: we should get a better explanation for why 
        // the appointment request failed.
        // are there no more appts left? 
        // or are there simply no appointments that fit this particular user?
        // This will become relevant once users have preferences or
        // restrictions.
        console.log("Could not find an appointment for the user.")
        _break = true;
      })
    }
  }

  // read
  async getAppointments() {}

  // update
  async freezeAppointments(frozen) {} // takes boolean

  // delete
  async deleteAppointments(appointments) {}
}
