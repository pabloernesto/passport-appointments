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

  // returns:
  //   Val({ user, date }) if there is an appointment for that user
  //   Err("No appointment.") if there is no appointment for that user
  //   Err("Enqueued.") if user is in the queue
  //   Err(`${username} is not a user.`) if the user does not exist
  async getAppointment(user) {
    const appt = await this._database.fetchAppointment(user);
    // smell? having both val and err undefined seems wrong
    if (appt.val !== undefined || appt.err !== undefined)
      return appt;
    const is_queued = await this._database.userIsInQueue(user);
    if (is_queued)
      return Err("Enqueued.");
    return Err("No appointment.")
  }

  // update

  // delete
  async cancelAppointment(user) {}



  /* administration */

  /* Create `slots` in the database.
    
     Slots are either Date objects or strings in `YYYY-MM-DD HH:mm:ss` format.
  */
  async createSlots(slots, auto_assign=true) {
    // format slots
    slots = slots.map(slot =>
      slot instanceof Date ? fecha.format(slot, 'YYYY-MM-DD HH:mm:ss')
      : slot
    )

    // create slots
    for (const slot of slots) {
      let creation = await this._database.createAppointmentSlot(slot);
    }

    // clear queue
    if (auto_assign)
      await this._autoAssignUsers();
  }

  /* Batch-create slots based on the provided restrictions. */
  async createSlotsBatch(
      date_start,
      date_end,
      weekdays,
      time_start,
      time_end,
      appointment_duration,
      auto_assign=true
  ) {
    let slots = [];
    return this.createSlots(slots, auto_assign);
  }

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

export function getDaysArray(start, end) {
  for(var arr=[],dt=new Date(start); dt<=end; dt.setDate(dt.getDate()+1)){
    arr.push(dt);
  }
  return arr;
};