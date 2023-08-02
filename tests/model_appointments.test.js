import Appointments from "../app/model/appointments";
import Store from '../app/storage/sqlite3/store';
import Authentication from '../app/lib/auth'


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
test('given an empty store, model.getAppointment() throws with missing user', async () => {
  await expect(model.getAppointment("Wonder Woman"))
  .rejects.toThrow('Wonder Woman is not a user.');
})

test('given a store with no appointments, model.getAppointment() returns undefined', async () => {
  await auth.createUser("Wonder Woman", "wonderwoman@un.org", "1984");
  await expect(model.getAppointment("Wonder Woman")).resolves.toBe(undefined);
})

test('request appointment', async () => {
  let when = "2023-01-01 12:00:00";
  await auth.createUser("Wonder Woman", "wonderwoman@un.org", "1984");
  await store.createAppointmentSlot(when);
  await model.requestAppointment("Wonder Woman");
  await expect(model.getAppointment("Wonder Woman")).resolves.toEqual({"date": when, "user": "Wonder Woman"});
})


test('request appointment without slot', async () => {
  let when = "2023-01-01 12:00:00";
  await auth.createUser("Wonder Woman", "wonderwoman@un.org", "1984");
  await expect(model.requestAppointment("Wonder Woman")).rejects.toThrow("No appointment available");
})
