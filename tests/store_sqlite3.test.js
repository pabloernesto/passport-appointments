import Store from '../app/storage/sqlite3/store';



/* Test context */
let database;

beforeEach(() => {
  database = Store.fromNewTestDB();
})



/* Tests */
test('create 3 users and 1 appointment', async () => {
  await database.addUser({
    user_id: "Superman",
    email: "superman@un.org",
    salt: "ABCD",
    hash: "EFGH"
  });

  await database.addUser({
  user_id: "Batman",
  email: "batman@bat_base.org",
  salt: "ABCD",
  hash: "EFGH"
  });
  
  await database.addUser({
  user_id: "Wonder Woman",
  email: "wonderwoman@un.org",
  salt: "ABCD",
  hash: "EFGH"
  });

  let user = await database.getUser("Wonder Woman");
    
  await database.createAppointment(user.user_id);
  let appt = await database.fetchAppointment(user.user_id)
  expect(appt.date).toBe("sunday the 1th");
});

test('create 3 appointments', async () => {
  let pending_users = [];
  pending_users +=  database.addUser({
    user_id: "Superman",
    email: "superman@un.org",
    salt: "ABCD",
    hash: "EFGH"
  });

  pending_users += database.addUser({
  user_id: "Batman",
  email: "batman@bat_base.org",
  salt: "ABCD",
  hash: "EFGH"
  });
  
  pending_users += database.addUser({
  user_id: "Wonder Woman",
  email: "wonderwoman@un.org",
  salt: "ABCD",
  hash: "EFGH"
  });

  await Promise.all(pending_users);
  
  let user = await database.getUser("Wonder Woman");
  await database.createAppointment(user.user_id);
  let appt = await database.fetchAppointment(user.user_id)
  expect(appt.date).toBe("sunday the 1th");

  user = await database.getUser("Batman");
  await database.createAppointment(user.user_id);
  appt = await database.fetchAppointment(user.user_id)
  expect(appt.date).toBe("sunday the 2th");

  user = await database.getUser("Superman");
  await database.createAppointment(user.user_id);
  appt = await database.fetchAppointment(user.user_id)
  expect(appt.date).toBe("sunday the 3th");
});
