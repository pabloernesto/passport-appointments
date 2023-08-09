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

/* WARN: this API is allowed to fail when the request is from an unknown user.
    getting the user from the request is auth's responsibility, and should be
    handled through token matching.
*/

test('given a GET request, ignore it', async () => {
  req = {
    method: "GET",
    url: "/appointment"
  };
  res = {};

  await expect(mw.respond(req, res))
  .resolves.toBe(false);
})

test('given a model with no slots, when appt is requested add them to the queue', async () => {
  store.addUser("Mr. Banana", "mr.banana@bigbanana.com", "hash", "salt");
  req = { 
    method: "POST",
    url: "/appointment",
  };
  mw._formBody = req => ({
    userid: "Mr. Banana"
  });
  res = {
    body: undefined,        // output
    statusCode: undefined,  // output
    setHeader() {},
    end(data) { this.body = data; },
  };

  await expect(mw.respond(req, res)).resolves.toBe(true);
  expect(res.statusCode).toBe(200);
  expect(res.body).toMatch("Mr. Banana, there are no appointments currently available.");
})

test('given a model with one slot, when appt is requested assign it to the user', async () => {
  store.addUser("Mr. Banana", "mr.banana@bigbanana.com", "hash", "salt");
  const when = "2023-01-01 11:00";
  await store.createAppointmentSlot(when);
  req = {
    method: "POST",
    url: "/appointment",
  };
  mw._formBody = req => ({
    userid: "Mr. Banana"
  });
  res = {
    body: undefined,        // output
    statusCode: undefined,  // output
    setHeader() {},
    end(data) { this.body = data; },
  };

  await expect(mw.respond(req, res)).resolves.toBe(true);
  expect(res.statusCode).toBe(200);
  expect(res.body).toMatch(`Mr. Banana, you have your appointment at ${ when }`);
})

test('given a user in the queue, when requesting appointment tell them they are in the queue', async () => {
  store.addUser("Mr. Banana", "mr.banana@bigbanana.com", "hash", "salt");
  await model.requestAppointment("Mr. Banana");
  req = {
    method: "POST",
    url: "/appointment",
  };
  mw._formBody = req => ({
    userid: "Mr. Banana"
  });
  res = {
    body: undefined,        // output
    statusCode: undefined,  // output
    setHeader() {},
    end(data) { this.body = data; },
  };

  await expect(mw.respond(req, res)).resolves.toBe(true);
  expect(res.statusCode).toBe(200);
  expect(res.body).toMatch("Mr. Banana, you are already in the queue.");
})
