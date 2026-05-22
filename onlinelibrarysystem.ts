import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('http://localhost:3000/login');
  await page.locator('input[name="username"]').click();
  await page.locator('input[name="username"]').fill('user1');
  await page.locator('input[name="username"]').press('Tab');
  await page.locator('input[name="password"]').fill('reset123');
  await page.getByRole('button', { name: 'Login' }).click();
}

async function checkout(page: Page) {
await login(page);
await page.getByRole('button', { name: 'Add to cart' }).nth(2).click();
await page.getByRole('spinbutton').click();
await page.getByRole('spinbutton').fill('4');
await page.getByRole('button', { name: 'Update' }).click();
await page.locator('input[name="name"]').click();
await page.locator('input[name="name"]').press('CapsLock');
await page.locator('input[name="name"]').fill('A');
await page.locator('input[name="name"]').press('CapsLock');
await page.locator('input[name="name"]').fill('Anitha');
await page.locator('input[name="name"]').press('Tab');
await page.locator('textarea[name="address"]').press('CapsLock');
await page.locator('textarea[name="address"]').fill('N');
await page.locator('textarea[name="address"]').press('CapsLock');
await page.locator('textarea[name="address"]').fill('New ');
await page.locator('textarea[name="address"]').press('CapsLock');
await page.locator('textarea[name="address"]').fill('New J');
await page.locator('textarea[name="address"]').press('CapsLock');
await page.locator('textarea[name="address"]').fill('New Jersey');
await page.locator('textarea[name="address"]').click();
await page.getByRole('button', { name: 'Checkout' }).click();
await page.getByRole('link', { name: 'View orders' }).click();
}

test('Login Success', async ({ page }) => {
  //Call the login function to perform login steps
await login(page);
 //Verify once logged in a welcome banner and the list of available books.
await page.getByText('Welcome, user1').click();
});

test('Browse Catalog', async ({ page }) => {
await login(page);
// Verify that book cards display title, author, price, quantity input, and Add to cart button.
  //await expect(page.locator('text=Online Library')).toBeVisible(); 
  const elements = [
    page.getByText('Online Library'),
    page.getByText('Cart').nth(0),
    page.getByText('My Orders'),
  ]
  for (const element of elements) {
  await expect(element).toBeVisible();
}
});

test('Add to Cart', async ({ page }) => {
await login(page);
// Click on Add to cart for a book and verify it appears in the cart with correct title, price, and quantity.
await page.getByRole('button', { name: 'Add to cart' }).first().click();
});

test('Add multiple quantities to Cart', async ({ page }) => {
await login(page);
// Fill the quantity input as 3 and click on Add to cart for a book and verify it appears in the cart with correct title, price, and quantity.
await page.locator('input[name="quantity"]').first().fill('3');
await page.getByRole('button', { name: 'Add to cart' }).first().click();
});

test('Update Cart Quantity', async ({page}) => {
await login(page);
await page.getByRole('button', { name: 'Add to cart' }).first().click();
await page.getByRole('spinbutton').click();
await page.getByRole('spinbutton').click();
await page.getByRole('spinbutton').fill('5');
await page.getByRole('button', { name: 'Update' }).click();
});

test('Remove from Cart', async ({ page }) => {
await login(page);
await page.getByRole('button', { name: 'Add to cart' }).nth(1).click();
await page.getByRole('spinbutton').click();
await page.getByRole('spinbutton').fill('2');
await page.getByRole('button', { name: 'Update' }).click();
await page.locator('input[name="name"]').click();
await page.getByRole('button', { name: 'Remove' }).click();
await page.getByRole('link', { name: 'Browse books' }).click();
});

test('Checkout Flow', async({page}) =>{
await login(page);
await checkout(page);
});

test('Bad characters in checkout - Main Page', async({page})=>{
await login(page);
await page.getByRole('spinbutton').first().click();
await page.getByRole('spinbutton').first().click();
await page.getByRole('spinbutton').first().fill('0');
await page.getByRole('button', { name: 'Add to cart' }).first().click();
});

test('Bad characters in checkout - Checkout Page', async({page})=>{
await login(page);
await page.getByRole('button', { name: 'Add to cart' }).nth(1).click();
await page.getByRole('spinbutton').click();
await page.getByRole('spinbutton').fill('0');
await page.getByRole('button', { name: 'Update' }).click();
await page.getByRole('spinbutton').click();
await page.getByRole('spinbutton').fill('-4');
await page.getByRole('button', { name: 'Update' }).click();
});

test('Logout Flow', async({page}) =>{
await login(page);
await page.getByRole('link', { name: 'Logout' }).click();
await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('Login Failure', async ({ page }) => {
  //Enter the web link and login with username and password
await page.goto('http://localhost:3000/login');
await page.locator('input[name="username"]').click();
  //Fill the username and password fields and click on login button
await page.locator('input[name="username"]').click();
await page.locator('input[name="username"]').fill('user1');
await page.locator('input[name="password"]').click();
await page.locator('input[name="password"]').fill('wrongpassword');
await page.getByRole('button', { name: 'Login' }).click()
  // Verify error message is displayed
await expect(page.locator('text=Invalid username or password')).toBeVisible();
  // Verify user remains on login page
await expect(page).toHaveURL(/.*login/)
});

test('Forgot Password (Demo Reset)', async ({ page }) => {
await page.goto('http://localhost:3000/login');
await page.locator('input[name="username"]').click();
await page.getByRole('link', { name: 'Forgot password?' }).click();
await page.locator('input[name="username"]').click();
await page.locator('input[name="username"]').fill('user1');
await page.locator('input[name="username"]').press('Tab');
await page.locator('input[name="email"]').fill('user1@example.com');
await page.getByRole('button', { name: 'Reset Password' }).click();
await expect(page.locator('text=Password reset to "reset123" (demo). Please login.')).toBeVisible()
});
