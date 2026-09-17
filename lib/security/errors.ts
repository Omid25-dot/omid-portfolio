import 'server-only';
import { RateLimitError } from '@/lib/rate-limit/errors';
export function reportFailure(operation: string, error?: unknown) {
  if (error instanceof RateLimitError) return { error: error.message };
  const reference = crypto.randomUUID();
  // Never log request bodies, auth tokens, email addresses or raw provider errors.
  console.error(JSON.stringify({ operation, reference }));
  return { error: `We couldn't complete this request. Please try again later. Reference: ${reference}` };
}
