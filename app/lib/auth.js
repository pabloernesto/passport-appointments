import { randomBytes, createHash } from 'crypto';

const TOKEN_VALIDITY = 60 * 60 * 1000; // 1 hour
const TOKEN_INVALIDATION_PERIOD = 5 * 60 * 1000; // 5 minutes

function hash(data) {
  const hashFunction = createHash('sha256');
  hashFunction.update(data);
  return hashFunction.digest('base64url');
}

class Authentication {
  constructor(database) {
    this.database = database;
    // key: token
    // value: { token: token, emitted: date }
    this.userTokens = new Map();
    // NOTE: potentially add anon tokens

    // Set up repeating timer to invalidate expired tokens
    // TODO: move this out of constructor so it can be controlled explicitly;
    //   it is interfering with test code.
    // setInterval(() => this.invalidateExpiredTokens(), TOKEN_INVALIDATION_PERIOD);
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
    return await this.database.getUser(username).catch(err => undefined);
  }

  async authenticateUser(username, password) {
    const user = await this.database.getUser(username).catch(err => undefined);
    return !!user && user.hash === hash(password + user.salt);
  }

  generateLoginSessionToken(user_id) {
    let sessionToken;
    if(!user_id) throw Error("Must have valid user id to create session");
    do {
      const bytes = randomBytes(16);
      sessionToken = bytes.toString('base64url');
    } while (this.userTokens.has(sessionToken));
    this.userTokens.set(sessionToken, {
      token: sessionToken,
      user_id: user_id,
      emitted: new Date(),
    });
    return sessionToken;
  }

  isValidSessionToken(s) {
    return this.userTokens.has(s);
  }

  invalidateExpiredTokens() {
    const expirationTime = new Date().getTime() - TOKEN_VALIDITY;

    for (const { token, emitted } of this.userTokens.values()) {
      if (emitted.getTime() <= expirationTime)
        // modifying the map while iterating it doesn't seem to break the iterator
        this.userTokens.delete(token);
    }
  }

    // TODO: better information flow
  async userHasPermission(username, perm) {
    const user = await this.getUser(username);
    return user.role.includes(perm);
  }
}

export default Authentication;
