import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Polling avoids macOS/sandbox file-descriptor limits; callers may override it.
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, WATCHPACK_POLLING: process.env.WATCHPACK_POLLING || '1000' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 0));
