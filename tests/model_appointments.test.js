import Appointments from "../app/model/appointments";
import Store from '../app/storage/sqlite3/store';
import Authentication from '../app/lib/auth'
import fecha from 'fecha'


/* Test context */
let model;
let auth;
let store;

beforeEach(() => {
  store = Store.fromNewTestDB();
  model = new Appointments(store);
  auth = new Authentication(store);
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
  await model.requestAppointment("Wonder Woman");
  await expect(model.getAppointment("Wonder Woman")).rejects.toThrow("No appointment available");
})
