import Store from '../app/storage/sqlite3/store';
import Authentication from '../app/lib/auth';
import { Val, Err } from '../app/lib/maybe';



/* Test context */
let auth;
let store;

beforeEach(async () => {
  store = Store.fromNewTestDB();
  auth = await Authentication.fromDatabase(store);
})



/* Tests */
test('given an empty store, auth.createUser() resolves', async () => {
  await expect(auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984", "u"))
  .resolves;
})

test('given an empty store, authentication fails', async () => {
  await expect(auth.authenticateUser("Wonder Woman2", "1984"))
  .resolves.toBe(false);
})

test('given a single user, when given wrong password, authentication fails', async () => {
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984", "u");
  await expect(auth.authenticateUser("Wonder Woman2", "69"))
  .resolves.toBe(false);
})

test('given a single user, authentication succeeds', async () => {
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984", "u");
  await expect(auth.authenticateUser("Wonder Woman2", "1984"))
  .resolves.toBe(true);
})

test('given a single user, when getting user return user data', async () => {
  await auth.createUser("Wonder Woman2", "wonderwoman@un.org", "1984", "u");

  const userdata = await auth.getUser("Wonder Woman2");

  expect(userdata).toEqual(Val({
    user: "Wonder Woman2",
    email: "wonderwoman@un.org",
    hash: expect.any(String),
    salt: expect.any(String),
    role: "u"
  }));
})
