import Store from '../app/storage/sqlite3/store';



/* Test context */
let database;

beforeEach(() => {
  database = Store.fromNewTestDB();
})

async function fillWithSuperheroes(database) {
  const superheroes = [
    ["Superman", "superman@un.org", "ABCD", "EFGH", "u"],
    ["Batman", "batman@bat_base.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman2", "wonderwoman@un.org", "ABCD", "EFGH", "u"],
  ];
  await Promise.all(superheroes.map(hero => database.addUser(...hero)));
}



/* Tests */

// Users
test('creating a user', async () => {
  await fillWithSuperheroes(database);
  let user = await database.getUser("Superman");

  expect(user.user).toBe("Superman");
  expect(user.email).toBe("superman@un.org");
  expect(user.hash).toBe("ABCD");
  expect(user.salt).toBe("EFGH");
  expect(user.role).toBe("u");
})



// Appointments
// TODO: change this to fail if the appointment slot isn't available
// TODO: change this to require an embassy site parameter
test('create 3 users and 1 appointment', async () => {
  await fillWithSuperheroes(database);
  
  let when = "2023-01-01 12:00:00";
  let appt = await database.createAppointment("Wonder Woman2", when);
  
  expect(appt.date).toBe(when);
});

test('create 3 appointments', async () => {
  await fillWithSuperheroes(database);
  
  let when = "2023-01-01 12:00:00";
  let appt = await database.createAppointment("Wonder Woman2", when);
  expect(appt.date).toBe(when);

  when = "2023-01-02 12:00:00";
  appt = await database.createAppointment("Superman", when);
  expect(appt.date).toBe(when);

  when = "2023-01-03 12:00:00";
  appt = await database.createAppointment("Batman", when);
  expect(appt.date).toBe(when);
});

test('given an existing appointment, store.fetchAppointment() returns it', async () => {
  await fillWithSuperheroes(database);
  let when = "2023-01-01 12:00:00";
  await database.createAppointment("Wonder Woman2", when);

  await expect(database.fetchAppointment("Wonder Woman2"))
  .resolves.toEqual({ user: "Wonder Woman2", date: when });
})

test('given no appointment, store.fetchAppointment() returns undefined', async () => {
  await fillWithSuperheroes(database);

  await expect(database.fetchAppointment("Wonder Woman2"))
  .resolves.toBe(undefined);
})

test('given an empty store, store.fetchAppointment() throws', async () => {
  await expect(database.fetchAppointment("Wonder Woman2"))
  .rejects.toThrow('Wonder Woman2 is not a user.');
})

test('fail to create appointment for unknown user', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.createAppointment("Wonder Woman2", when))
  .rejects.toThrow('Wonder Woman2 is not a user.');
})

test('fail to create appointment for null user', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.createAppointment(null, when))
  .rejects.toThrow();
})

test('fail to create appointment for undefined user', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.createAppointment(null, when))
  .rejects.toThrow();
})



// Slots
test('create slot', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.getNearestAppointmentSlot()).resolves.toBe(undefined);
  await expect(database.createAppointmentSlot(when)).resolves.toEqual({"date": when });
  await expect(database.getNearestAppointmentSlot()).resolves.toEqual({"date": when, "slot_id":1 });
})



// Queue
test('given an empty queue, when getting first user return undefined', async () => {
  await expect(database.getFirstUserInQueue())
  .resolves.toBe(undefined);
})

test('add user to queue', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await expect(database.getFirstUserInQueue()).resolves.toEqual("Superman");
})

test('given a queue with a user, when getting first user remove them from the queue', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await expect(database.getFirstUserInQueue())
  .resolves.toBe("Superman");
  await expect(database.getFirstUserInQueue())
  .resolves.toBe(undefined);
})
