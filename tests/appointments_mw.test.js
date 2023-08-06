import AppointmentsMW from "../app/ui/http/appointment";
import Store from "../app/storage/sqlite3/store"
import Appointments from "../app/model/appointments";

let mw;
let store;
let model;

let req;
let res;

beforeEach(async () => {
  store = await Store.fromNewTestDB();
  model = new Appointments(store);
  mw = new AppointmentsMW(model);
})

test('given a GET request, ignore it', async () => {
  req = {
    method: "GET",
    url: "/appointment"
  };
  res = {};

  await expect(mw.respond(req, res))
  .resolves.toBe(false);
})
