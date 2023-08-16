import fecha from 'fecha';
import { Val, Err } from '../lib/maybe.js'

export default class Appointments {
  constructor(database) {
    this._database = database;
  }

  /* appointments */
  async requestAppointment(username) {
    const old_appt = await this._database.fetchAppointment(username);
    if (old_appt.err?.message?.includes("is not a user")) {
      return Err("No such user", { user: username });

    } else if (old_appt.err) {
      return old_appt;  // unknown error

    } else if (!old_appt.err && old_appt.val !== undefined) {
      return Err(
        "Already has appointment",
        {
          appointment: old_appt.val,
          user: username
        });
    }

    // user does not have an appt, attempt to create one
    let slot = await this._database.popNearestAppointmentSlot();
    if (!slot.err && !slot.val) {
      const queued = await this._database.addUserToQueue(username);
      return !queued.err ? Val("In queue.")
        : queued;
    }

    await this._database.createAppointment(username, slot.val.date);
    let new_appt = await this._database.fetchAppointment(username);
    if (new_appt.val)
      return Val(new String(new_appt.val.date));
    else  
      return Err("Could not create appointment", { cause: new_appt.err });
  }

  // read
  async getAppointment(user) {
    const appt = await this._database.fetchAppointment(user);
    if (appt.err)
      return appt;
    if (!appt.err && appt.val === undefined)
      return Err('No appointments for this user.', { user });
    return appt;
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
      const nslots = await this._database.totalSlotsLeft();
      const nusers = await this._database.totalUsersInQueue();
      if (nslots.val === 0 || nusers.val === 0)
        break;

      // these statements should never fail. if they do, either:
      // 1. the db is dead
      // 2. we hit a race condition
      // 3. the underlying store is buggy
      let slot = await this._database.popNearestAppointmentSlot();
      if (slot.err || !slot.val) throw Error("Bad!");
      let user = await this._database.getFirstUserInQueue();
      if (user.err || !user.val) throw Error("Bad!");

      this._database.createAppointment(user.val, slot.val.date);
    }
  }

  // read
  async getAppointments() {}

  // update
  async freezeAppointments(frozen) {} // takes boolean

  // delete
  async deleteAppointments(appointments) {}
}
