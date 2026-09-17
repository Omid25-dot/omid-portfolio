// Test sessions are accepted only by tests/fixtures/auth-server.mjs.
export function fixtureSession(identity: 'customer'|'staff'|'super_admin') {
 const sub = {customer:'30000000-0000-4000-8000-000000000001',staff:'30000000-0000-4000-8000-000000000002',super_admin:'30000000-0000-4000-8000-000000000003'}[identity];
 const exp=Math.floor(Date.now()/1000)+3600;
 const token = `${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub,exp,aud:'authenticated',role:'authenticated'})).toString('base64url')}.test-signature`;
 return 'base64-'+Buffer.from(JSON.stringify({access_token:token,refresh_token:'test-refresh',expires_at:exp,expires_in:3600,token_type:'bearer',user:{id:sub,user_metadata:{role:'super_admin'}}})).toString('base64url');
}
