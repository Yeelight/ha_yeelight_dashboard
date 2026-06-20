export async function ensureAuthenticated(page, { username, password }) {
  if (await hasHass(page, 15000)) return;
  if (!(await isAuthPage(page))) {
    await waitForHass(page);
    return;
  }
  await login(page, { username, password });
  await waitForHass(page);
}

export async function hasHass(page, timeout = 5000) {
  return page
    .waitForFunction(() => Boolean(document.querySelector("home-assistant")?.hass), undefined, { timeout })
    .then(() => true)
    .catch(() => false);
}

export async function login(page, { username, password }) {
  if (!username || !password) return;
  await waitForLoginForm(page);
  await checkRememberMe(page);
  await page.locator('input[type="text"], input:not([type]), input[type="email"]').first().fill(username);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /登录|log in/i }).click();
}

export async function waitForHass(page, timeout = 30000) {
  try {
    await page.waitForFunction(() => Boolean(document.querySelector("home-assistant")?.hass), undefined, { timeout });
  } catch {
    const body = await page.locator("body").innerText().catch(() => "");
    throw new Error(`Authenticated Home Assistant frontend was not available. url=${page.url()} body=${body.slice(0, 500)}`);
  }
}

export async function waitForHassStates(page, minimumStates = 1, timeout = 30000) {
  if (minimumStates <= 0) return;
  try {
    await page.waitForFunction(
      (expected) => Object.keys(document.querySelector("home-assistant")?.hass?.states || {}).length >= expected,
      minimumStates,
      { timeout }
    );
  } catch {
    const stateCount = await page
      .evaluate(() => Object.keys(document.querySelector("home-assistant")?.hass?.states || {}).length)
      .catch(() => 0);
    throw new Error(`Home Assistant states were not ready. expected>=${minimumStates} actual=${stateCount} url=${page.url()}`);
  }
}

async function checkRememberMe(page) {
  await page.getByLabel(/保持登录|keep me logged|remember/i).check().catch(async () => {
    await page.locator('input[type="checkbox"]').first().check().catch(() => {});
  });
}

async function isAuthPage(page) {
  if (page.url().includes("/auth/")) return true;
  const body = await page.locator("body").innerText({ timeout: 1000 }).catch(() => "");
  return /登录|log in/i.test(body);
}

async function waitForLoginForm(page) {
  await page.locator('input[type="text"], input:not([type]), input[type="email"]').first().waitFor({ timeout: 30000 });
  await page.locator('input[type="password"]').first().waitFor({ timeout: 30000 });
}
