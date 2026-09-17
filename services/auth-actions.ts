'use server';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { appOrigin } from '@/lib/config/server';
import { assertSameOrigin } from '@/lib/security/origin';
import { enforceRateLimit } from '@/lib/rate-limit/server';
import { reportFailure } from '@/lib/security/errors';
import { safeNext } from '@/lib/permissions/policy';
import { loginSchema, signupSchema, resetRequestSchema, resetPasswordSchema, confirmationSchema } from '@/lib/validation/schemas';
import { clearRecoveryGrant, hasRecoveryGrant, setRecoveryGrant } from '@/lib/auth/recovery';
import type { FormState } from '@/types/forms';

export async function login(_previous: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: 'Check your email and password.', fields: parsed.error.flatten().fieldErrors };
  try {
    await assertSameOrigin(); await enforceRateLimit('login', parsed.data.email);
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: 'Unable to sign in. Check your details and confirm your email.' };
    await clearRecoveryGrant();
  } catch (error) { return reportFailure('auth.login', error); }
  redirect(safeNext(form.get('next')));
}
export async function signup(_previous: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: 'Check the highlighted fields.', fields: parsed.error.flatten().fieldErrors };
  try {
    await assertSameOrigin(); await enforceRateLimit('signup', parsed.data.email);
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signUp({ ...parsed.data, options: { emailRedirectTo: `${appOrigin()}/auth/callback` } });
    if (error) return { error: 'Unable to create an account. Try again later or use password recovery.' };
    return { success: 'Check your email for the confirmation link. If you already have an account, sign in or reset your password.' };
  } catch (error) { return reportFailure('auth.signup', error); }
}
export async function forgotPassword(_previous: FormState, form: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse({ email: form.get('email') });
  if (!parsed.success) return { error: 'Enter a valid email address.', fields: parsed.error.flatten().fieldErrors };
  try {
    await assertSameOrigin(); await enforceRateLimit('recovery-request', parsed.data.email);
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${appOrigin()}/reset-password` });
    if (error) return reportFailure('auth.recovery-provider');
    return { success: 'If an account exists for that email, we will send a password reset link.' };
  } catch (error) { return reportFailure('auth.recovery-request', error); }
}
export async function confirmEmail(_previous: FormState, form: FormData): Promise<FormState> {
  const parsed = confirmationSchema.safeParse({ token_hash: form.get('token_hash'), type: form.get('type') });
  if (!parsed.success) return { error: 'This link is invalid. Request a new email.' };
  let destination = '/account';
  try {
    await assertSameOrigin(); await enforceRateLimit('confirm-email');
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.verifyOtp(parsed.data);
    if (error || !data.user) return { error: 'This link has expired or has already been used. Request a new email.' };
    if (parsed.data.type === 'recovery') { await setRecoveryGrant(data.user.id); destination = '/reset-password'; }
    else await clearRecoveryGrant();
  } catch (error) { return reportFailure('auth.confirm', error); }
  redirect(destination);
}
export async function resetPassword(_previous: FormState, form: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({ password: form.get('password'), confirm_password: form.get('confirm_password') });
  if (!parsed.success) return { error: 'Check the highlighted fields.', fields: parsed.error.flatten().fieldErrors };
  try {
    await assertSameOrigin();
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || !await hasRecoveryGrant(user.id)) return { error: 'Request a new password reset link.' };
    await enforceRateLimit('reset-password', user.id);
    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (updateError) return { error: 'Unable to update your password. Use a different password or request a new link.' };
    await clearRecoveryGrant();
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
    if (signOutError) return { success: 'Your password was updated.', error: 'We could not sign out your sessions. Please try signing out again.' };
  } catch (error) { return reportFailure('auth.reset-password', error); }
  redirect('/login?reset=success');
}
export async function logout(): Promise<FormState> {
  try {
    await assertSameOrigin();
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) return reportFailure('auth.logout');
    await clearRecoveryGrant();
  } catch (error) { return reportFailure('auth.logout', error); }
  redirect('/login');
}
