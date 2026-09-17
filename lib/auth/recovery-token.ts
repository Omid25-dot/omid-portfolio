import { createHmac, timingSafeEqual } from 'node:crypto';
const signature = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('hex');
export function signRecoveryToken(id: string, secret: string, now = Date.now()) {
 const payload = `${id}.${now + 15 * 60 * 1000}`;
 return `${payload}.${signature(payload,secret)}`;
}
export function verifyRecoveryToken(value: string | undefined, id: string, secret: string, now = Date.now()) {
 if (!value) return false;
 const parts=value.split('.');
 if (parts.length !== 3) return false;
 const [subject,expires,supplied]=parts;
 if (subject !== id || !/^\d+$/.test(expires) || !Number.isSafeInteger(Number(expires)) || Number(expires) <= now || !/^[a-f0-9]{64}$/.test(supplied)) return false;
 return timingSafeEqual(Buffer.from(supplied), Buffer.from(signature(`${subject}.${expires}`,secret)));
}
