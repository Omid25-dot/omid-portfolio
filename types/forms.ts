export type FormState = { error?: string; success?: string; fields?: Record<string, string[] | undefined> };
export type FormAction = (previous: FormState, data: FormData) => Promise<FormState>;
