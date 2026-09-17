import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props} />;
}
export function Card({ children }: { children: ReactNode }) { return <section className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">{children}</section>; }
export function Badge({ children }: { children: ReactNode }) { return <span className="inline-flex rounded-full border border-border px-3 py-1 text-sm font-semibold">{children}</span>; }
export function Input({ label, error, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <div className="space-y-2"><label htmlFor={id} className="block text-sm font-semibold">{label}</label><input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="w-full rounded-lg border border-border bg-surface px-3 py-3" {...props} />{error && <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>}</div>;
}
