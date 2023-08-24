const loggedInEndpoints = {
  '/appointment': { roles: ["u"] },
  '/admin': { roles: ["a"] },
  '/slots': { roles: ["a"] },
}

export { loggedInEndpoints };
