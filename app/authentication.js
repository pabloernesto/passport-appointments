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
    this.validTokens = new Map();

    // Set up repeating timer to invalidate expired tokens
    setInterval(() => this.invalidateExpiredTokens(), TOKEN_INVALIDATION_PERIOD);
  }

  async authenticateUser(username, password) {
    const user = await this.database.getUser(username);
    return user && user.hash === hash(password + user.salt);
  }

  generateSessionToken() {
    let sessionToken;
    do {
      const bytes = randomBytes(16);
      sessionToken = bytes.toString('base64url');
    } while (this.validTokens.has(sessionToken));
    this.validTokens.set(sessionToken, {
      token: sessionToken,
      emitted: new Date(),
    });
    return sessionToken;
  }

  isValidSessionToken(s) {
    return this.validTokens.has(s);
  }

  invalidateExpiredTokens() {
    const expirationTime = new Date().getTime() - TOKEN_VALIDITY;

    for (const { token } of this.validTokens.values()) {
      if (token.emitted.getTime() <= expirationTime)
        // modifying the map while iterating it doesn't seem to break the iterator
        validTokens.delete(token);
    }
  }
}

export default Authentication;
