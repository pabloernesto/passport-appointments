import Store from '../app/storage/sqlite3/store';
import { Val, Err } from '../app/lib/maybe';



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

async function fillWithMoreSuperheroes(database) {
  const superheroes = [
    ["Superman", "superman@un.org", "ABCD", "EFGH", "u"],
    ["Batman", "batman@bat_base.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman2", "wonderwoman@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman3", "wonderwoman3@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman4", "wonderwoman4@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman5", "wonderwoman5@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman6", "wonderwoman6@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman7", "wonderwoman7@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman8", "wonderwoman8@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman9", "wonderwoman9@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman10", "wonderwoman10@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman11", "wonderwoman11@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman12", "wonderwoman12@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman13", "wonderwoman13@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman14", "wonderwoman14@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman15", "wonderwoman15@un.org", "ABCD", "EFGH", "u"],
    ["Wonder Woman16", "wonderwoman16@un.org", "ABCD", "EFGH", "u"],
  ];
  await Promise.all(superheroes.map(hero => database.addUser(...hero)));
}

/* Tests */

// Users
test('creating a user', async () => {
  await fillWithSuperheroes(database);
  let user = await database.getUser("Superman");

  expect(user).toEqual(Val({
    user: "Superman",
    email: "superman@un.org",
    hash: "ABCD",
    salt: "EFGH",
    role: "u"
  }));
})



// Appointments
// TODO: change this to fail if the appointment slot isn't available
// TODO: change this to require an embassy site parameter
test('create 3 users and 1 appointment', async () => {
  await fillWithSuperheroes(database);

  let when = "2023-01-01 12:00:00";
  let appt = await database.createAppointment("Wonder Woman2", when);

  expect(appt).toEqual(Val({
    user: "Wonder Woman2",
    date: when
  }));
});

test('create 3 appointments', async () => {
  await fillWithSuperheroes(database);

  let when = "2023-01-01 12:00:00";
  let appt = await database.createAppointment("Wonder Woman2", when);
  expect(appt).toEqual(Val({
    user: "Wonder Woman2",
    date: when
  }));

  when = "2023-01-02 12:00:00";
  appt = await database.createAppointment("Superman", when);
  expect(appt).toEqual(Val({
    user: "Superman",
    date: when
  }));

  when = "2023-01-03 12:00:00";
  appt = await database.createAppointment("Batman", when);
  expect(appt).toEqual(Val({
    user: "Batman",
    date: when
  }));
});

test('given an existing appointment, store.fetchAppointment() returns it', async () => {
  await fillWithSuperheroes(database);
  let when = "2023-01-01 12:00:00";
  await database.createAppointment("Wonder Woman2", when);

  await expect(database.fetchAppointment("Wonder Woman2"))
  .resolves.toEqual(Val({
    user: "Wonder Woman2",
    date: when
  }));
})

test('given no appointment, store.fetchAppointment() returns undefined', async () => {
  await fillWithSuperheroes(database);

  await expect(database.fetchAppointment("Wonder Woman2"))
  .resolves.toEqual(Val(undefined));
})

test('given an empty store, store.fetchAppointment() fails', async () => {
  await expect(database.fetchAppointment("Wonder Woman2"))
  .resolves.toEqual(Err('Wonder Woman2 is not a user.'));
})

test('fail to create appointment for unknown user', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.createAppointment("Wonder Woman2", when))
  .resolves.toEqual(Err('Wonder Woman2 is not a user.'));
})

test('fail to create appointment for null user', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.createAppointment(null, when))
  .resolves.toEqual(Err('null is not a user.'));
})

test('fail to create appointment for undefined user', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.createAppointment(undefined, when))
  .resolves.toEqual(Err('undefined is not a user.'));
})



// Slots
test('create slot', async () => {
  let when = "2023-01-01 12:00:00";
  await expect(database.popNearestAppointmentSlot())
  .resolves.toEqual(Val(undefined));
  await expect(database.createAppointmentSlot(when))
  .resolves.toEqual(Val({
    "date": when
  }));
  await expect(database.popNearestAppointmentSlot())
  .resolves.toMatchObject(Val({
    date: when
  }));
})

test('given a database with a slot, when creating a slot before it assign the new slot first', async () => {
  let near_future = "2023-08-18 12:00:00";
  let far_future = "2023-08-20 12:00:00";
  await database.createAppointmentSlot(far_future);

  await database.createAppointmentSlot(near_future);

  await expect(database.popNearestAppointmentSlot())
  .resolves.toMatchObject(Val({
    date: near_future
  }));
})



// Queue
test('given an empty queue, when getting first user return undefined', async () => {
  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val(undefined));
})

test('add user to queue', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val("Superman"));
})

test('add users to queue', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await database.addUserToQueue("Batman");
  await database.addUserToQueue("Wonder Woman2");
  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val("Superman"));
})


test('given a queue with a user, when getting first user remove them from the queue', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val("Superman"));
  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val(undefined));
})

test('given a queue with 3 users, when getting from the queue return them in insertion order', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await database.addUserToQueue("Batman");
  await database.addUserToQueue("Wonder Woman2");

  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val("Superman"));
  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val("Batman"));
  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val("Wonder Woman2"));
  await expect(database.getFirstUserInQueue())
  .resolves.toEqual(Val(undefined));
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
    Val("Superman"),
    Val("Batman"),
    Val("Wonder Woman2"),
    Val(undefined)
  ]);
  expect(results).toEqual(expected);
})

/* TODO: this test is for a race condition. modify to run several times. */
test('given a queue with three users, interleaved pops and pushes take from the front of the queue', async () => {
  await fillWithMoreSuperheroes(database);
  await Promise.all([
    database.addUserToQueue("Superman"),
    database.addUserToQueue("Batman"),
    database.addUserToQueue("Wonder Woman2")
  ]);

  const pop_promises = [
    database.getFirstUserInQueue(),
    database.getFirstUserInQueue(),
    database.getFirstUserInQueue()
  ];
  const push_promises = [
    database.addUserToQueue("Wonder Woman3"),
    database.addUserToQueue("Wonder Woman4"),
    database.addUserToQueue("Wonder Woman5")
  ];
  await Promise.all([...pop_promises, ...push_promises]);
  const pops = await Promise.all(pop_promises);

  // users already in the queue should be served first
  const expected = expect.arrayContaining([
    Val("Superman"),
    Val("Batman"),
    Val("Wonder Woman2")
  ]);
  expect(pops).toEqual(expected);
})

test('given a queue, adding same user twice results in error', async () => {
  await fillWithSuperheroes(database);
  await database.addUserToQueue("Superman");
  await expect(database.addUserToQueue("Superman"))
  .resolves.toEqual(Err("User already in queue."));
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