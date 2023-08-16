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
  .resolves.toEqual({ val: undefined });
})

test('given user in auth and single slot, when appointment is requested it is accepted with the correct date format', async () => {
  let when = Date.now();  // test value changes every run. potential problem.
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984");
  await model.createSlots([when], true);
  await model.requestAppointment("Wonder Woman2");
  await expect(model.getAppointment("Wonder Woman2"))
  .resolves.toEqual({ val: {
      user: "Wonder Woman2",
      date: fecha.format(when, 'YYYY-MM-DD HH:mm:ss')
  }});
})

test('given no slots, when requesting appt it enqueues', async () => {
  let when = "2023-01-01 12:00:00";
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984");
  await expect(model.requestAppointment("Wonder Woman2"))
  .resolves.toEqual({ val: "In queue." });
})

test('given a user in the queue, when slots are added give the user an appointment', async () => {
  let when = Date.now();
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984");
  await model.requestAppointment("Wonder Woman2");

  // auto-assign=true
  // TODO: remove auto-assign? when is auto-assign=false desirable?
  await model.createSlots([when], true); 

  await expect(model.getAppointment("Wonder Woman2"))
  .resolves.toEqual({ val: {
      user: "Wonder Woman2",
      date: fecha.format(when, 'YYYY-MM-DD HH:mm:ss')
  }});
})

test('not enough slots for 3 users', async () => {
  let when = Date.now();
  await auth.createUser("Batman", "batman@batcave.org", "1964");
  await auth.createUser("Superman", "superman@un.org", "1950");
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984");

  await model.requestAppointment("Batman");
  await model.requestAppointment("Superman");
  await model.requestAppointment("Wonder Woman2");

  await model.createSlots([when, when], true);

  await expect(model.getAppointment("Batman"))
  .resolves.toEqual({ val: {
      user: "Batman",
      date: fecha.format(when, 'YYYY-MM-DD HH:mm:ss')
  }});
  
  await expect(model.getAppointment("Superman"))
  .resolves.toEqual({ val: {
    user: "Superman",
    date: fecha.format(when, 'YYYY-MM-DD HH:mm:ss')
  }});
  
  const appt = await model.getAppointment("Wonder Woman2");
  await expect(appt.val).toEqual(undefined);

})

test('trying to autoassign with empty queue does not consume a slot', async () => {
  
  let when = Date.now();
  await auth.createUser("Batman", "batman@batcave.org", "1964");
  await auth.createUser("Superman", "superman@un.org", "1950");
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984");

  // create two slots
  await model.createSlots([when, when], true);

  // should only consume one slot
  await model.requestAppointment("Batman");

  // so this request is successful
  await model.requestAppointment("Superman");
  
  await expect(model.getAppointment("Superman"))
  .resolves.toEqual({ val: {
    user: "Superman",
    date: fecha.format(when, 'YYYY-MM-DD HH:mm:ss')
  }});

})