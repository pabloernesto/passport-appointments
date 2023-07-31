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
    ["Wonder Woman", "wonderwoman@un.org", "ABCD", "EFGH", "u"],
  ];
  await Promise.all(superheroes.map(hero => database.addUser(...hero)));
}



/* Tests */
test('creating a user', async () => {
  await fillWithSuperheroes(database);
  let user = await database.getUser("Superman");

  expect(user.user).toBe("Superman");
  expect(user.email).toBe("superman@un.org");
  expect(user.hash).toBe("ABCD");
  expect(user.salt).toBe("EFGH");
  expect(user.role).toBe("u");
})

// TODO: change this to fail if the appointment slot isn't available
// TODO: change this to require an embassy site parameter
test('create 3 users and 1 appointment', async () => {
  await fillWithSuperheroes(database);
  
  let when = "2023-01-01 12:00:00";
  let appt = await database.createAppointment("Wonder Woman", when);
  
  expect(appt.date).toBe(when);
});

test('create 3 appointments', async () => {
  await fillWithSuperheroes(database);
  
  let when = "2023-01-01 12:00:00";
  let appt = await database.createAppointment("Wonder Woman", when);
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
  await database.createAppointment("Wonder Woman", when);

  await expect(database.fetchAppointment("Wonder Woman"))
  .resolves.toEqual({ user: "Wonder Woman", date: when });
})

test('given no appointment, store.fetchAppointment() returns undefined', async () => {
  await fillWithSuperheroes(database);

  await expect(database.fetchAppointment("Wonder Woman"))
  .resolves.toBe(undefined);
})

test('given an empty store, store.fetchAppointment() throws', async () => {
  await expect(database.fetchAppointment("Wonder Woman"))
  .rejects.toThrow('Wonder Woman is not a user.');
})

test('fail to create appointment for unknown user', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.createAppointment("Wonder Woman", when))
  .rejects.toThrow('Wonder Woman is not a user.');
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

// create slot
test('create slot', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.getNearestAppointmentSlot()).resolves.toBe(undefined);
  await expect(database.createAppointmentSlot(when)).resolves.toEqual({"date": when });
  await expect(database.getNearestAppointmentSlot()).resolves.toEqual({"date": when, "slot_id":1 });
})