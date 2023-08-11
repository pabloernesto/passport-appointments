export function Val(val) {
  return { val };
}

export function Err(message, opts) {
  return { err: {
    message,
    ...opts
  }};
}
