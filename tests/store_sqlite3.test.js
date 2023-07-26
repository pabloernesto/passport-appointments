import Store from '../app/storage/sqlite3/store';



/* Test context */
let database;

beforeEach(() => {
  database = Store.fromNewTestDB();
})



/* Tests */
test('creating a user', async () => {
  await database.addUser("Superman", "superman@un.org", "ABCD", "EFGH");
  let user = await database.getUser("Superman");

  expect(user.user).toBe("Superman");
  expect(user.email).toBe("superman@un.org");
  expect(user.hash).toBe("ABCD");
  expect(user.salt).toBe("EFGH");
})

// TODO: change this to fail if the appointment slot isn't available
// TODO: change this to require an embassy site parameter
test('create 3 users and 1 appointment', async () => {
  await database.addUser("Superman", "superman@un.org", "ABCD", "EFGH");
  await database.addUser("Batman", "batman@bat_base.org", "ABCD", "EFGH");
  await database.addUser("Wonder Woman", "wonderwoman@un.org", "ABCD", "EFGH");
  
  let when = "2023-01-01 12:00";
  let appt = await database.createAppointment("Wonder Woman", when);
  
  expect(appt.date).toBe(when);
});

test('create 3 appointments', async () => {
  await database.addUser("Superman", "superman@un.org", "ABCD", "EFGH");
  await database.addUser("Batman", "batman@bat_base.org", "ABCD", "EFGH");
  await database.addUser("Wonder Woman", "wonderwoman@un.org", "ABCD", "EFGH");
  
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
