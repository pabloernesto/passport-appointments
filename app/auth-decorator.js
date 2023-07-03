import { randomBytes, createHash } from 'crypto';

const TOKEN_VALIDITY = 60 * 60 * 1000; // 1 hour
const TOKEN_INVALIDATION_PERIOD = 5 * 60 * 1000; // 5 minutes

export default class AuthDecorator {
  constructor(base, storage) {
    this._base = base;
    this._storage = storage;
    this._tokens = new Map();
    AuthDecorator.decorate(this, base);
    // periodically invalidate tokens
    setInterval(() => this._invalidateExpiredTokens(), TOKEN_INVALIDATION_PERIOD);
  }



  /* authentication */

  // create
  async createUser(username, email, password) {
    if (await this._storage.getUser(username))
      throw new Error('User exists');

    await this._storage.addUser(username, email, password);
  }

  // read
  async authenticate(username, password) {
    const user = await this._storage.getUser(username);
    return (
      !user ? undefined
      : !this._paswordMatches(user, password) ? undefined
      : this._newToken()
    );
  }
  isValidToken(token) {
    return this._tokens.has(token);
  }
  // no state, should be static or free f?
  _paswordMatches(user, password) {
    return hash(String.prototype.concat(password, user.salt)) === user.hash;
  }
  _hash(data) {
    const hashFunction = createHash('sha256');
    hashFunction.update(data);
    return hashFunction.digest('base64url');
  }
  _newToken() {
    let sessionToken;
    // generate tokens until we hit a new one
    do {
      const bytes = randomBytes(16);
      sessionToken = bytes.toString('base64url');
    } while (this._tokens.has(sessionToken));
    // store token and metadata
    this._tokens.set(sessionToken, {
      token: sessionToken,
      emitted: new Date(),
    });
    return sessionToken;
  }

  // update

  // delete
  userFromToken(token) {
    return this._tokens.get(token)?.user;
  }
  invalidateToken(token) {
    this._tokens.delete(token);
  }
  _invalidateExpiredTokens() {
    const expirationTime = new Date().getTime() - TOKEN_VALIDITY;

    for (const { token, emitted } of this._tokens.values()) {
      if (emitted.getTime() <= expirationTime)
        // modifying the map while iterating it doesn't seem to break the iterator
        this._tokens.delete(token);
    }
  }


  /* metaprogramming */
  static decorate(decorator, base) {
    Object.entries(base)
    .filter(([ prop, value ]) => typeof value === 'function')
    .map(([ prop, f ]) => [ prop, AuthDecorator.wrapCall(f, decorator, base) ])
    .forEach(([ prop, f ]) => {
      if (decorator[prop])
        throw new Error(`Decorator has property ${ prop }`);
      decorator[prop] = f;
    });
  }

  static wrapCall(f, decorator, base) {
    return (token, ...args) =>  {
      if (!decorator.isTokenValid(token))
        throw new Error('Invalid token');
      return f.apply(base, args);
    }
  }
}
