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
  
  let when = "2023-01-01";
  let appt = await database.createAppointment("Wonder Woman", when);
  
  expect(appt.date).toBe(when);
});

// test('create 3 appointments', async () => {
//   let pending_users = [];
//   pending_users +=  database.addUser({
//     user_id: "Superman",
//     email: "superman@un.org",
//     salt: "ABCD",
//     hash: "EFGH"
//   });

//   pending_users += database.addUser({
//   user_id: "Batman",
//   email: "batman@bat_base.org",
//   salt: "ABCD",
//   hash: "EFGH"
//   });
  
//   pending_users += database.addUser({
//   user_id: "Wonder Woman",
//   email: "wonderwoman@un.org",
//   salt: "ABCD",
//   hash: "EFGH"
//   });

//   await Promise.all(pending_users);
  
//   let user = await database.getUser("Wonder Woman");
//   await database.createAppointment(user.user_id);
//   let appt = await database.fetchAppointment(user.user_id)
//   expect(appt.date).toBe("sunday the 1th");

//   user = await database.getUser("Batman");
//   await database.createAppointment(user.user_id);
//   appt = await database.fetchAppointment(user.user_id)
//   expect(appt.date).toBe("sunday the 2th");

//   user = await database.getUser("Superman");
//   await database.createAppointment(user.user_id);
//   appt = await database.fetchAppointment(user.user_id)
//   expect(appt.date).toBe("sunday the 3th");
// });
