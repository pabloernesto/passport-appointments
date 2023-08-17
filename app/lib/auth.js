import { randomBytes, createHash } from 'crypto';
import { Val, Err } from './maybe.js';

const TOKEN_VALIDITY = 60 * 60 * 1000; // 1 hour
const TOKEN_INVALIDATION_PERIOD = 5 * 60 * 1000; // 5 minutes

function hash(data) {
  const hashFunction = createHash('sha256');
  hashFunction.update(data);
  return hashFunction.digest('base64url');
}

class Authentication {
  //@private
  constructor(database) {
    this.database = database;
    // key: token
    // value: { token: token, user_id: id, emitted: date }
    this.userTokens = new Map();
    // NOTE: potentially add anon tokens

    // Set up repeating timer to invalidate expired tokens
    // TODO: move this out of constructor so it can be controlled explicitly;
    //   it is interfering with test code.
    // setInterval(() => this.invalidateExpiredTokens(), TOKEN_INVALIDATION_PERIOD);
  }

  static async fromDatabase(database) {
    // TODO: VULNERABLE: hardcoded admin account
    let password = "1234";
    let salt = randomBytes(12).toString('base64url');
    await database.addUserWithRole("Wonder Woman", "q@q.q", hash(password + salt), salt, "a");
    return new Authentication(database);
  }

  createUser(username, email, password) {
    // one base64 char is 6 bits of entropy (2^6 = 64)
    // one random byte is 8 bits of entropy
    // so 3 random bytes have the same entropy as 4 random base64 chars
    //   (3*8 = 4*6 = 24)
    // 16 base64 chars requires 16*3/4 = 12 random bytes
    const salt = randomBytes(12).toString('base64url');
    return this.database.addUser(username, email, hash(password + salt), salt);
  }

  async getUser(username) {
    return await this.database.getUser(username);
  }

  async authenticateUser(username, password) {
    const user = await this.database.getUser(username);
    return (
      !user.val ? Err(`${username} is not a user.`)
      : Val(user.val.hash === hash(password + user.val.salt))
    );
  }

  generateLoginSessionToken(user_id) {
    if (!user_id)
      return Err("Must have valid user id to create session", { user_id });

    let sessionToken;
    do {
      const bytes = randomBytes(16);
      sessionToken = bytes.toString('base64url');
    } while (this.userTokens.has(sessionToken));

    this.userTokens.set(sessionToken, {
      token: sessionToken,
      user_id: user_id,
      emitted: new Date(),
    });
    return Val(sessionToken);
  }

  isValidSessionToken(s) {
    return Val(this.userTokens.has(s));
  }

  invalidateExpiredTokens() {
    const expirationTime = new Date().getTime() - TOKEN_VALIDITY;

    for (const { token, emitted } of this.userTokens.values()) {
      if (emitted.getTime() <= expirationTime)
        // modifying the map while iterating it doesn't seem to break the iterator
        this.userTokens.delete(token);
    }
  }

  invalidateToken(token) {
    this.userTokens.delete(token);
  }

  // TODO: better information flow
  // NOTE: perm is a single-letter permission
  async userHasPermission(username, perm) {
    const user = await this.getUser(username);
    if (!user.val)
      return Err(`${username} is not a user.`);

    return Val(user.val.role.includes(perm));
  }
}

export default Authentication;
