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

test('add users to queue', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await database.addUserToQueue("Batman");
  await database.addUserToQueue("Wonder Woman2");
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

test('given a queue with 3 users, when getting from the queue return them in insertion order', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await database.addUserToQueue("Batman");
  await database.addUserToQueue("Wonder Woman2");

  await expect(database.getFirstUserInQueue())
  .resolves.toBe("Superman");
  await expect(database.getFirstUserInQueue())
  .resolves.toBe("Batman");
  await expect(database.getFirstUserInQueue())
  .resolves.toBe("Wonder Woman2");
  await expect(database.getFirstUserInQueue())
  .resolves.toBe(undefined);
})

/* TODO: this test is for a race condition. modify to run several times. */
test('given an empty queue, when adding 3 users at the same time 3 users are inserted', async () => {
  await fillWithSuperheroes(database);

  // guarantee 2 users in queue
  const insertions_done = await Promise.all([
    database.addUserToQueue("Superman"),
    database.addUserToQueue("Batman"),
    database.addUserToQueue("Wonder Woman2")
  ]);

  // get 2 users and add user in non-guaranteed order
  const results = await Promise.all([
    database.getFirstUserInQueue(),
    database.getFirstUserInQueue(),
    database.getFirstUserInQueue(),
    database.getFirstUserInQueue()
  ]);

  const expected = expect.arrayContaining([
    "Superman",
    "Batman",
    "Wonder Woman2",
    undefined
  ]);
  expect(results).toEqual(expected);
})

test('given a queue, adding same user twice results in error', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await expect(database.addUserToQueue("Superman")).rejects.toThrow();
})

test('given a queue, adding same user twice results in error', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await expect(database.addUserToQueue("Superman")).rejects.toThrow();
})

test('After inserting 3 users, there are two users ahead of the last', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await database.addUserToQueue("Batman");
  await database.addUserToQueue("Wonder Woman2");
  await expect(database.totalUsersAheadOf("Superman")).resolves.toEqual(0);
  await expect(database.totalUsersAheadOf("Batman")).resolves.toEqual(1);
  await expect(database.totalUsersAheadOf("Wonder Woman2")).resolves.toEqual(2);
})

test('Given 3 users in a queue, deleting the middle user results in reordering of the rest', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await database.addUserToQueue("Batman");
  await database.addUserToQueue("Wonder Woman2");
  const row = await database.removeUserFromQueue("Batman");
  expect(row).toEqual("Batman");
  await expect(database.totalUsersAheadOf("Superman")).resolves.toEqual(0);
  await expect(database.totalUsersAheadOf("Wonder Woman2")).resolves.toEqual(1);
})


test('Given 3 users in a queue, deleting Batman twice results in undefined, but does not corrupt order', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await database.addUserToQueue("Batman");
  await database.addUserToQueue("Wonder Woman2");
  const row = await database.removeUserFromQueue("Batman");

  // 
  expect(database.removeUserFromQueue("Batman")).resolves.toEqual(undefined);
  await expect(database.totalUsersAheadOf("Superman")).resolves.toEqual(0);
  await expect(database.totalUsersAheadOf("Wonder Woman2")).resolves.toEqual(1);
})