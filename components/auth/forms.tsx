'use client';
import { useActionState } from 'react';
import { Button, Input } from '@/components/ui/primitives';
import type { FormAction } from '@/types/forms';
import type { Role } from '@/lib/permissions/policy';
type Field = { name: string; label: string; type?: string; autoComplete?: string; defaultValue?: string; required?: boolean };
export function ActionForm({ action, fields = [], label, hidden = {}, confirmation, roleSelect = false }: {
 action: FormAction; fields?: Field[]; label: string; hidden?: Record<string,string>; confirmation?: string; roleSelect?: boolean;
}) {
 const [state, formAction, pending] = useActionState(action, {});
 return <form action={formAction} className="space-y-5" aria-busy={pending}>
  {Object.entries(hidden).map(([name,value]) => <input key={name} name={name} value={value} type="hidden" />)}
  {fields.map(field => <Input key={field.name} id={field.name} name={field.name} label={field.label} type={field.type || 'text'} autoComplete={field.autoComplete} defaultValue={field.defaultValue} required={field.required ?? true} error={state.fields?.[field.name]?.[0]} />)}
  {roleSelect && <div className="space-y-2"><label htmlFor="role" className="block text-sm font-semibold">New role</label><select id="role" name="role" className="w-full rounded-lg border border-border bg-surface p-3">{(['customer','staff','admin','super_admin'] satisfies Role[]).map(role => <option key={role} value={role}>{role.replace('_',' ')}</option>)}</select></div>}
  {confirmation && <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="confirm" value="yes" required className="mt-1" />{confirmation}</label>}
  {state.error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{state.error}</p>}
  {state.success && <p role="status" className="rounded-lg border border-success p-3 text-sm text-success">{state.success}</p>}
  <Button type="submit" disabled={pending} className="w-full">{pending ? 'Please wait…' : label}</Button>
 </form>;
}
