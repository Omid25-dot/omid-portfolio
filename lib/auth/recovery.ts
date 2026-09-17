import 'server-only';
import { cookies } from 'next/headers';
import { serverSecret } from '@/lib/config/server';
import { signRecoveryToken, verifyRecoveryToken } from './recovery-token';
const name = 'rental-recovery';
export async function setRecoveryGrant(id: string) {
 (await cookies()).set(name, signRecoveryToken(id,serverSecret('SECURITY_HMAC_SECRET')), {
  httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 900,
 });
}
export async function hasRecoveryGrant(id: string) {
 const value=(await cookies()).get(name)?.value;
 if (!value) return false;
 return verifyRecoveryToken(value,id,serverSecret('SECURITY_HMAC_SECRET'));
}
export async function clearRecoveryGrant() { (await cookies()).delete(name); }
