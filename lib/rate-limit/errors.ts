export class RateLimitError extends Error {
  constructor() { super('Too many requests. Please wait 15 minutes before trying again.'); }
}
