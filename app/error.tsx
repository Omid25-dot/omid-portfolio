'use client';
import { Button } from '@/components/ui/primitives';
export default function ErrorPage({ reset }: { reset: () => void }) { return <div role="alert"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="my-4">Please try again. Your request could not be completed.</p><Button onClick={reset}>Try again</Button></div>; }
