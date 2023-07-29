import Store from '../app/storage/sqlite3/store';
import Authentication from '../app/lib/auth'



/* Test context */
let auth;
let store;

beforeEach(() => {
  store = Store.fromNewTestDB();
  auth = new Authentication(store);
})



/* Tests */
test('given an empty store, auth.createUser() resolves', async () => {
  await expect(auth.createUser("Wonder Woman", "wonderwoman@un.org", "1984"))
  .resolves;
})

test('given an empty store, authentication fails', async () => {
  await expect(auth.authenticateUser("Wonder Woman", "1984"))
  .resolves.toBe(false);
})

test('given a single user, when given wrong password, authentication fails', async () => {
  await auth.createUser("Wonder Woman", "wonderwoman@un.org", "1984");
  await expect(auth.authenticateUser("Wonder Woman", "69"))
  .resolves.toBe(false);
})

test('given a single user, authentication succeeds', async () => {
  await auth.createUser("Wonder Woman", "wonderwoman@un.org", "1984");
  await expect(auth.authenticateUser("Wonder Woman", "69"))
  .resolves;
})
