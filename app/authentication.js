import { randomBytes } from 'crypto';

// key: token
// value: { token: token, emitted: date }
let validTokens = new Map();

const TOKEN_VALIDITY = 60 * 60 * 1000; // 1 hour
const TOKEN_INVALIDATION_PERIOD = 5 * 60 * 1000; // 5 minutes

export async function authenticateUser(username, password, database) {
  const user = await database.getUser(username);
  return user && user.hash === hash(password + user.salt);
}

export function generateSessionToken() {
  let sessionToken;
  do {
    const bytes = randomBytes(16);
    sessionToken = bytes.toString('base64url');
  } while (validTokens.has(sessionToken));
  validTokens.set(sessionToken, {
    token: sessionToken,
    emitted: new Date(),
  });
  return sessionToken;
}

export function isValidSessionToken(s) {
  return validTokens.has(s);
}

export function invalidateExpiredTokens() {
  const expirationTime = new Date().getTime() - TOKEN_VALIDITY;

  for (const { token } of validTokens.values()) {
    if (tokenObject.emitted.getTime() <= expirationTime)
      // modifying the map while iterating it doesn't seem to break the iterator
      validTokens.delete(token);
  }
}

// Set up repeating timer to invalidate expired tokens
setInterval(invalidateExpiredTokens, TOKEN_INVALIDATION_PERIOD);
