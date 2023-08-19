import AuthenticationMW from '../app/lib/http/auth.js';
import Authentication from '../app/lib/auth.js';
import Store from '../app/storage/sqlite3/store.js';
import { Val, Err } from '../app/lib/maybe.js'
import { jest } from '@jest/globals';

let mockauth = {
  getTokenRecord: jest.fn(),
  userHasPermission: jest.fn(),
};
let authmw;

let req;
let res;

beforeEach(async () => {
  jest.clearAllMocks();
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
  // fake request with correct token
  req = {
    method: "GET",
    url: "/admin",
    headers: {
      cookie: "sesionToken=xxx"
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
})
