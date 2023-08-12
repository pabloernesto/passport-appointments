import fecha from 'fecha';
import { Val, Err } from '../lib/maybe.js'

export default class Appointments {
  constructor(database) {
    this._database = database;
  }

  /* appointments */
  async requestAppointment(user) {
    const has = await this._database.hasUser( { user_id: user} );
    if (!has)
      return Err("No such user", { user });

    const appt = await this._database.hasAppointment(user);
    if (appt)
      return Err("Already has appointment", { appointment: appt });

    let slot = await this._database.popNearestAppointmentSlot();
    if (!slot) {
      try {
        await this._database.addUserToQueue(user);
        return Val("In queue.");
      } catch (err) {
        err.user = user;
        return { err };
      }
    }

    await this._database.createAppointment(user, slot.date);
    let db_object = await this._database.fetchAppointment(user);
    if (db_object && db_object.date) 
      return Val(new String(db_object.date));
    else  
      return Err("Could not create appointment");
  }

  // read
  async getAppointment(user) {
    try {
      const appt = await this._database.fetchAppointment(user);
      if (appt === undefined)
        return Err('No appointments for this user.', { user });
      return Val(appt);

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
    */
    // check 1 week from current time
    for (const _date in dates) {
      let date = fecha.format(dates[_date], 'YYYY-MM-DD HH:mm:ss')
      await this._database.createAppointmentSlot(date);
    }
    
    if(auto_assign) {
      await this._autoAssignUsers();
    }
    
  } // TODO: take [ [date, number_of_slots]... ]

  /* 
    Give out appointments to users in the quJeue. 
    TODO: cleaner guarantee thatdata does not get lost when popping fails
  */
  async _autoAssignUsers() {
    while (true) {
      if(!(
          await this._database.totalSlotsLeft() 
          && await this._database.totalUsersInQueue())) 
        break;
      let slot = await this._database.popNearestAppointmentSlot();
      if (!slot) throw Error("Bad!");
      let user = await this._database.getFirstUserInQueue();
      if (!user) throw Error("Bad!");
      this._database.createAppointment(user, slot.date);
      
    }
  }

  // read
  async getAppointments() {}

  // update
  async freezeAppointments(frozen) {} // takes boolean

  // delete
  async deleteAppointments(appointments) {}
}
