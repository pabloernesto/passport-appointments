import Store from '../app/storage/sqlite3/store';



/* Test context */
let database;

beforeEach(() => {
  database = Store.fromNewTestDB();
})

async function fillWithSuperheroes(database) {
  const superheroes = [
    ["Superman", "superman@un.org", "ABCD", "EFGH"],
    ["Batman", "batman@bat_base.org", "ABCD", "EFGH"],
    ["Wonder Woman", "wonderwoman@un.org", "ABCD", "EFGH"],
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
})

// TODO: change this to fail if the appointment slot isn't available
// TODO: change this to require an embassy site parameter
test('create 3 users and 1 appointment', async () => {
  await fillWithSuperheroes(database);
  
  let when = "2023-01-01 12:00";
  let appt = await database.createAppointment("Wonder Woman", when);
  
  expect(appt.date).toBe(when);
});

test('create 3 appointments', async () => {
  await fillWithSuperheroes(database);
  
  let when = "2023-01-01 12:00";
  let appt = await database.createAppointment("Wonder Woman", when);
  expect(appt.date).toBe(when);

  when = "2023-01-02 12:00";
  appt = await database.createAppointment("Superman", when);
  expect(appt.date).toBe(when);

  when = "2023-01-03 12:00";
  appt = await database.createAppointment("Batman", when);
  expect(appt.date).toBe(when);
});

test('fail to create appointment for unknown user', async () => {
  let when = "2023-01-01 12:00";
  await expect(database.createAppointment("Wonder Woman", when))
  .rejects.toThrow('Wonder Woman is not a user.');
})

test('fail to create appointment for null user', async () => {
  let when = "2023-01-01 12:00";
  await expect(database.createAppointment(null, when))
  .rejects.toThrow();
})

test('fail to create appointment for undefined user', async () => {
  let when = "2023-01-01 12:00";
  await expect(database.createAppointment(null, when))
  .rejects.toThrow();
})
