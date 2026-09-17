// Test-only HTTP fixture, NOT Supabase and never loaded by the application.
// It lets browser tests exercise SSR authorisation separately from live Auth.
import { createServer } from 'node:http';
const server = createServer((request, response) => {
 let identity;
 try { identity = JSON.parse(Buffer.from((request.headers.authorization || '').split(' ')[1].split('.')[1], 'base64url').toString()).sub; } catch { /* anonymous */ }
 const roles = { '30000000-0000-4000-8000-000000000001': 'customer', '30000000-0000-4000-8000-000000000002': 'staff', '30000000-0000-4000-8000-000000000003': 'super_admin' };
 response.setHeader('Content-Type','application/json');
 if (!roles[identity]) { response.statusCode=401; response.end(JSON.stringify({message:'Invalid test session'})); return; }
 if (request.url.startsWith('/auth/v1/user')) {
  response.end(JSON.stringify({id:identity,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{role:'super_admin'},app_metadata:{},created_at:new Date().toISOString()})); return;
 }
 if (request.url.startsWith('/rest/v1/profiles')) {
  response.end(JSON.stringify({id:identity,role:roles[identity],account_status:'active',first_name:'Test',last_name:'Fixture',phone:''})); return;
 }
 response.statusCode=404; response.end('{}');
});
server.listen(54399,'127.0.0.1');
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close());
