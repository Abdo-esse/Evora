import { test, expect } from '@playwright/test';

test.describe('Full Reservation Flow', () => {
  const timestamp = Date.now();
  const participantEmail = `test_user_${timestamp}@example.com`;
  const participantPassword = 'password123';

  test('should register, reserve, accept, and logout', async ({ page, browser }) => {
    test.slow();

    console.log('--- Step 1: Registration ---');
    await page.goto('/register');
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', participantEmail);
    await page.fill('#password', participantPassword);
    await page.click('button:has-text("Create account")');

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    console.log('Registration successful.');

    console.log('--- Step 2: Participant Login ---');
    await page.fill('#email', participantEmail);
    await page.fill('#password', participantPassword);
    await page.click('button:has-text("Sign in")');
    await expect(page).toHaveURL(/\/events/, { timeout: 15000 });
    console.log('Participant login successful.');

    console.log('--- Step 3: Reservation ---');
    const firstEventCard = page.locator('div.grid > a').first();
    await expect(firstEventCard).toBeVisible({ timeout: 15000 });
    await firstEventCard.click();

    const reserveButton = page.locator('button:has-text("Reserve a seat")');
    await expect(reserveButton).toBeVisible({ timeout: 15000 });
    await reserveButton.click();
    await expect(page.locator('text=Reservation created!')).toBeVisible({ timeout: 15000 });
    console.log('Reservation created successfully.');

    console.log('--- Step 4: Participant Logout ---');
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    console.log('Participant logout successful.');

    // ============ ADMIN FLOW (NEW CONTEXT) ============
    console.log('--- Step 5: Admin Login (fresh context) ---');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto('/login');
    await adminPage.fill('#email', 'admi@evorat.com');
    await adminPage.fill('#password', 'admin123');

    await adminPage.click('button:has-text("Sign in")');
    await expect(adminPage).toHaveURL(/\/admin\/events/, { timeout: 15000 });
    console.log('Admin login successful.');

    console.log('--- Step 6: Admin Confirmation ---');

// Aller au module reservations
await adminPage.click('nav >> text=Reservations');
await expect(adminPage.locator('text=Manage Reservations')).toBeVisible({ timeout: 15000 });

// IMPORTANT: utilise une clé unique (email) au lieu de "Test"
console.log('Searching for the reservation by participant email...');
const searchInput = adminPage.locator('input[placeholder="Search reservations..."]');
await expect(searchInput).toBeVisible({ timeout: 15000 });

await searchInput.fill(participantEmail);
await adminPage.keyboard.press('Enter');

// Attendre que la table se remplisse (réseau + rendu)
const rows = adminPage.locator('tbody tr');
await expect(rows.first()).toBeVisible({ timeout: 15000 });

// Si parfois ça met du temps, on "poll" un peu
await expect
  .poll(async () => await rows.count(), { timeout: 15000 })
  .toBeGreaterThan(0);

// Trouver la ligne exacte contenant l'email
const targetRow = adminPage.locator('tbody tr').filter({ hasText: participantEmail }).first();

// Si l'email n'est pas affiché dans la table, fallback sur "Test User"
const fallbackRow = adminPage.locator('tbody tr').filter({ hasText: /Test/i }).first();

const useRow = (await targetRow.count()) > 0 ? targetRow : fallbackRow;

await expect(useRow).toBeVisible({ timeout: 15000 });
console.log('Reservation row found.');

// Bouton confirm dans la ligne
const confirmButton = useRow.locator('button:has-text("Confirm")');
await expect(confirmButton).toBeVisible({ timeout: 15000 });
await confirmButton.click();

await expect(adminPage.locator('text=Confirm reservation')).toBeVisible({ timeout: 15000 });
await adminPage.click('button:has-text("Confirm")');

// Message de succès (adapte si texte différent)
await expect(adminPage.locator('text=/Reservation confirmed/i')).toBeVisible({ timeout: 15000 });
console.log('Reservation confirmed successfully.');


    console.log('--- Step 7: Admin Logout ---');
    await adminPage.click('button:has-text("Logout")');
    await expect(adminPage).toHaveURL(/\/login/, { timeout: 15000 });
    console.log('Admin logout successful.');

    await adminContext.close();
  });
});
