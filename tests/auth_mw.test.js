import Store from '../app/storage/sqlite3/store';
import AuthenticationMW from '../app/lib/http/auth';

let store;
let authmw;

beforeEach(async () => {
  store = await Store.fromNewTestDB();
  authmw = new AuthenticationMW(store);
});

test('', async() => {
  // TODO
});
