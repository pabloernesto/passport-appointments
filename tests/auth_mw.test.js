import AuthenticationMW from '../app/lib/http/auth.js';
import Authentication from '../app/lib/auth.js';
import Store from '../app/storage/sqlite3/store.js';
import { Val, Err } from '../app/lib/maybe.js'
import { jest } from '@jest/globals';

describe("integration tests", () => {
  let store;
  let auth;
  let authmw;

  let res = {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(),
  };

  beforeEach(async () => {
    store = await Store.fromNewTestDB();
    // TODO: add some mechanism to create new admins from auth
    auth = await Authentication.fromDatabase(store); // adds default admin
    authmw = new AuthenticationMW(auth);
    jest.resetAllMocks();
  })

  test('given a user req, add the username to ctx', async () => {
    await auth.createUser("Batman", "batman@batcave.com", "catwoman69");
    const { val: token } = await auth.generateLoginSessionToken("Batman");
    expect(token).toEqual(expect.any(String));

    // fake request with correct token
    let req = {
      method: "GET",
      url: "/admin",
      headers: {
        cookie: `sessionToken=${ token }`
      }
    };
    let ctx = {};

    await authmw.respond(req, res, ctx);

    expect(ctx).toEqual({ user: "Batman" });
  })

  /* admins are not users, in that they aren't supposed to be able to ask for
    a passport appointment
   */
  test('given an admin req for an appointment, reject it', async () => {
    const { val: token } = await auth.generateLoginSessionToken("Wonder Woman");
    expect(token).toEqual(expect.any(String));

    // fake request with correct token
    let req = {
      method: "GET",
      url: "/appointment",
      headers: {
        cookie: `sessionToken=${ token }`
      }
    };
    let ctx = {};

    const is_captured = await authmw.respond(req, res, ctx);

    expect(is_captured).toBe(false); // redirects to static error
    expect(ctx).toEqual({ user: "Wonder Woman" });
    expect(res.statusCode).toBe(403);
  })
})

/* NOTE: these should get a lot less attention than the integration tests.
    Modify them primarily to track down specific problems.
 */
describe("unit tests", () => {
  let mockauth = {
    getTokenRecord: jest.fn(),
    getUser: jest.fn(),
  };
  let authmw;

  let req;
  let res;

  beforeEach(async () => {
    jest.resetAllMocks();
    authmw = new AuthenticationMW(mockauth);

    req = {};
    res = {};
  });

  test('given a logged in req, add the username to ctx', async () => {
    // fake logged in user
    mockauth.getTokenRecord.mockReturnValue(Val({
      token: "xxx",
      user_id: "Batman",
      emitted: new Date(2023, 1, 1)
    }));
    mockauth.getUser.mockReturnValue(Val({
      user: "Batman",
      role: "u"
    }));
    // fake request with correct token
    req = {
      method: "GET",
      url: "/admin",
      headers: {
        cookie: "sessionToken=xxx"
      }
    };
    let ctx = {};

    await authmw.respond(req, res, ctx);

    expect(ctx).toEqual({ user: "Batman" });
  })

  test('given a req with no token to a logged in area, block it', async () => {
    mockauth.getTokenRecord.mockReturnValue(Val(undefined));
    // fake request with missing token
    req = {
      method: "GET",
      url: "/admin",
    };
    res.getHeader = jest.fn();
    res.setHeader = jest.fn();
    res.end = jest.fn();
    let ctx = {};

    const out = await authmw.respond(req, res, ctx);

    expect(out).toBe(true);
    expect(ctx).toEqual( {} );
    expect(res.statusCode).toBe(302);
  })
})
