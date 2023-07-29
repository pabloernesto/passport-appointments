import Appointments from "../app/model/appointments";
import Store from '../app/storage/sqlite3/store';



/* Test context */
let model;
let store;

beforeEach(() => {
  store = Store.fromNewTestDB();
  model = new Appointments(store);
})



/* Tests */
test('given an empty store, model.getAppointment() throws with missing user', async () => {
  await expect(model.getAppointment("Wonder Woman"))
  .rejects.toThrow('Wonder Woman is not a user.');
})

// test('given a store with no appointments, model.getAppointment() returns undefined', async () => {
//   await store.addUser("Wonder Woman", "wonderwoman@un.org", "ABCD", "EFGH");
//   expect(model.getAppointment()).resolves.toBe(undefined);
// })
