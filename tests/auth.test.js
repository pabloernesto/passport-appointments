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
  await expect(auth.createUser("Wonder Woman", "wonderwoman@un.org", "1234"))
  .resolves;
})
