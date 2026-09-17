import { test, expect, type BrowserContext } from '@playwright/test';
import { fixtureSession } from '../fixtures/session';
async function session(context: BrowserContext, identity: 'customer'|'staff'|'super_admin') {
 const value = fixtureSession(identity);
 await context.addCookies([{name:'sb-127-auth-token',value,url:'http://127.0.0.1:3101',sameSite:'Lax'}]);
}
test('anonymous account/admin requests redirect to login',async({page})=>{
 for (const path of ['/account','/admin']) { await page.goto(path); await expect(page).toHaveURL(/\/login\?next=/); await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible(); }
});
test('customer reaches account but cannot enter admin despite forged metadata',async({page,context})=>{
 await session(context,'customer'); await page.goto('/account'); await expect(page.getByRole('heading',{name:'Your account'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Admin',exact:true})).toHaveCount(0);
 await page.goto('/admin'); await expect(page).toHaveURL(/\/forbidden$/);
});
test('staff gets operations foundation without privileged actions',async({page,context})=>{
 await session(context,'staff'); await page.goto('/admin'); await expect(page.getByRole('heading',{name:'Admin access'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Confirm role change'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Record access review'})).toHaveCount(0);
});
test('super admin sees controlled privileged action forms',async({page,context})=>{
 await session(context,'super_admin'); await page.goto('/admin'); await expect(page.getByRole('button',{name:'Confirm role change'})).toBeVisible();
 await expect(page.getByRole('checkbox')).toHaveCount(2);
});
test('login fails safely with missing rate-limit configuration',async({page})=>{
 await page.goto('/login'); await page.getByLabel('Email address').fill('fixture@example.invalid'); await page.getByLabel('Password',{exact:true}).fill('password-for-test');
 await page.getByRole('button',{name:'Sign in',exact:true}).click(); await expect(page.getByRole('alert')).toContainText("couldn't complete"); await expect(page).toHaveURL(/\/login$/);
});
test('password validation is enforced by the server',async({page})=>{
 await page.goto('/signup'); await page.getByLabel('Email address').fill('fixture@example.invalid'); await page.getByLabel('Password',{exact:true}).fill('short');
 await page.getByRole('button',{name:'Create account'}).click(); await expect(page.getByText('Use at least 12 characters.')).toBeVisible();
});
test('a signed-in session alone cannot open password recovery',async({page,context})=>{
 await session(context,'customer'); await page.goto('/reset-password'); await expect(page).toHaveURL(/\/forgot-password$/);
});
test('mobile form fits viewport and security headers are set',async({page})=>{
 const response=await page.goto('/login'); expect(response?.headers()['x-frame-options']).toBe('DENY');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 await expect(page.getByLabel('Email address')).toBeVisible();
});
