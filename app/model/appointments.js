import fecha from 'fecha'
export default class Appointments {
  constructor(database) {
    this._database = database;
  }

  /* appointments */

  async findOpenAppointmentFor(user) {
    let nearest = await this._database.getNearestAppointmentSlot();
    return (
      nearest ? { val: nearest.date }
      : { err: { message: "No open slot." } }
    );
  }

  async requestAppointment(user) {
    const has = await this._database.hasUser( { user_id: user} );
    if (!has) return { err: {
      message: "No such user",
      user
    }};

    const appt = await this._database.hasAppointment(user);
    if (appt) return { err: {
      message: "Already has appointment",
      appointment: appt
    }};

    let slot = await this._database.getNearestAppointmentSlot();
    if (!slot)
      return { err: {
        message: "No slots available."
      }};

    await this._database.createAppointment(user, slot.date);
    let db_object = await this._database.fetchAppointment(user);
    if (db_object && db_object.date) 
      return { val: new String(db_object.date) };
    else  
      return { err: {
        message: "Could not create appointment"
      }};
  }

  async queueUserForAppointment(user) {
    try {
      await this._database.addUserToQueue(user);
      return {};
    } catch (err) {
      return { err: {
        message: err.message,
        user
      }};
    }
  }

  // read
  async getAppointment(user) {
    try {
      const appt = await this._database.fetchAppointment(user);
      if (appt === undefined)
        return { err: {
          message: 'No appointments for this user.',
          user
        }};
      return { val: appt };

    } catch (err) {
      return { err };
    }
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
