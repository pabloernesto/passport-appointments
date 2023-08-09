import Appointments from "../app/model/appointments";
import Store from '../app/storage/sqlite3/store';
import Authentication from '../app/lib/auth'
import fecha from 'fecha';

/* Test context */
let model;
let auth;
let store;

beforeEach(async () => {
  store = Store.fromNewTestDB();
  model = new Appointments(store);
  auth = await Authentication.fromDatabase(store);
})



/* Tests */
test('given an empty store, model.getAppointment() fails with missing user', async () => {
  await expect(model.getAppointment("Wonder Woman2"))
  .resolves.toMatchObject({ err: {
    message: 'Wonder Woman2 is not a user.'
  }});
})

test('given a store with no appointments, model.getAppointment() fails with no appointment', async () => {
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984");
  await expect(model.getAppointment("Wonder Woman2"))
  .resolves.toMatchObject({ err: {
    message: 'No appointments for this user.',
    user: "Wonder Woman2"
  }});
})

test('given user in auth and single slot, when appointment is requested it is accepted with the correct date format', async () => {
  let when = Date.now();
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984");
  await model.createSlots([when], false);
  await model.requestAppointment("Wonder Woman2");
  await expect(model.getAppointment("Wonder Woman2"))
  .resolves.toEqual({ val: {
      user: "Wonder Woman2",
      date: fecha.format(when, 'YYYY-MM-DD HH:mm:ss')
  }});
})

test('when you request an appointment without slots available it fails', async () => {
  let when = "2023-01-01 12:00:00";
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984");
  await expect(model.requestAppointment("Wonder Woman2"))
  .resolves.toEqual({ err: {
    message: "No slots available."
  }});
})
