import { test, expect, type Page } from "@playwright/test";

const APP_URL = process.env.E2E_APP_URL || "http://localhost:8080";
const BACKEND_URL = process.env.E2E_BACKEND_URL || "http://localhost:3000";

function uniqueUser(prefix: string) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return {
    name: `${prefix} User`,
    email: `${prefix.toLowerCase()}-${stamp}@example.com`,
    password: "Aa!23456",
    country: "IN"
  };
}

async function goHome(page: Page) {
  await page.goto(APP_URL, { waitUntil: "networkidle" });
}

async function getAuthFromStorage(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem("token"));
  const participant_id = await page.evaluate(() =>
    localStorage.getItem("participant_id")
  );
  if (!token || !participant_id) {
    throw new Error("Missing auth token/participant_id in localStorage");
  }
  return { token, participant_id };
}

async function apiPostJson(
  page: Page,
  url: string,
  token: string,
  body: any
) {
  const res = await page.request.post(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    data: body
  });
  return res;
}

async function registerViaUi(page: Page, user: ReturnType<typeof uniqueUser>) {
  await goHome(page);
  await page.getByRole("button", { name: /create one/i }).click();
  await expect(page).toHaveURL(/\/signup$/);

  const signupForm = page.locator("form");
  await signupForm.locator('input:not([type])').first().fill(user.name); // Full Name
  await signupForm.locator('input[type="email"]').fill(user.email); // Email Address
  await signupForm.locator('input[type="password"]').fill(user.password); // Password
  await page.locator("select").first().selectOption(user.country);

  await signupForm.locator('input[type="checkbox"]').first().check();

  const [res] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/api/register") &&
        r.request().method() === "POST"
    ),
    page.waitForEvent("dialog").then((d) => d.accept()),
    page.getByRole("button", { name: /create account/i }).click()
  ]);
  expect(res.status(), "Signup should succeed (200)").toBe(200);

  await expect(page).toHaveURL(/\/$/);
}

async function loginViaUi(page: Page, user: ReturnType<typeof uniqueUser>) {
  await goHome(page);
  await page.getByPlaceholder(/you@insead\.edu/i).fill(user.email);
  await page.getByPlaceholder(/password/i).fill(user.password);

  const loginResPromise = page.waitForResponse(
    (r) =>
      r.url().includes("/api/login") && r.request().method() === "POST"
  );
  const maybeDialog = page
    .waitForEvent("dialog", { timeout: 5000 })
    .then((d) => d.accept())
    .catch(() => {});

  await page.getByRole("button", { name: /sign in/i }).click();

  const loginRes = await loginResPromise;
  await maybeDialog;

  expect(loginRes.status(), "Login should succeed (200)").toBe(200);

  await Promise.any([
    page.getByRole("heading", { name: /baseline assessment/i }).waitFor(),
    page.getByRole("heading", { name: /weekly tracker/i }).waitFor(),
    page.getByRole("heading", { name: /dashboard/i }).waitFor()
  ]);
}

async function submitBaseline(page: Page) {
  const { token, participant_id } = await getAuthFromStorage(page);

  const payload = {
    participant_id,
    phone_devices: 1,
    phone_storage_gb: 64,
    laptop_devices: 1,
    laptop_storage_gb: 128,
    tablet_devices: 0,
    tablet_storage_gb: 0,
    cloud_accounts: 1,
    cloud_storage_gb: 50,
    screen_time_hours: 6,
    streaming_hours_week: 4,
    tiktok_minutes: 20,
    instagram_minutes: 15,
    facebook_minutes: 10,
    youtube_minutes: 30,
    downloads_gb_week: 5
  };

  const res = await apiPostJson(
    page,
    `${BACKEND_URL}/api/baseline`,
    token,
    payload
  );
  expect(res.status(), "Baseline submit should succeed").toBe(200);
}

async function submitWeekly(page: Page) {
  const { token, participant_id } = await getAuthFromStorage(page);

  const progRes = await page.request.get(
    `${BACKEND_URL}/api/progress/${participant_id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  expect(progRes.status(), "Progress should load").toBe(200);
  const prog = await progRes.json();
  const nextWeek = Number(prog?.submitted ?? 0) + 1;

  const payload = {
    participant_id,
    week_number: nextWeek,
    storage_deleted_gb: 10,
    downloads_avoided_gb: 3,
    streaming_reduction_minutes: 120,
    screen_time_change_minutes: 60,
    emails_reduced: 0,
    messages_reduced: 0,
    ritual_completed: false,
    alumni_touchpoints: 2,
    tiktok_reduction_minutes: 0,
    instagram_reduction_minutes: 0,
    facebook_reduction_minutes: 0,
    youtube_reduction_minutes: 0
  };

  const res = await apiPostJson(
    page,
    `${BACKEND_URL}/api/weekly`,
    token,
    payload
  );
  expect(res.status(), "Weekly submit should succeed").toBe(200);
}

test("Register → Login → Baseline → Weekly → Dashboard", async ({ page }) => {
  const user = uniqueUser("flow1");

  await registerViaUi(page, user);
  await loginViaUi(page, user);
  await submitBaseline(page);

  await page.goto(`${APP_URL}/weekly`, { waitUntil: "networkidle" });
  await submitWeekly(page);

  await page.goto(`${APP_URL}/dashboard`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});

test("Prevent weekly without baseline", async ({ page }) => {
  const user = uniqueUser("flow2");

  await registerViaUi(page, user);
  await loginViaUi(page, user);

  await page.goto(`${APP_URL}/weekly`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/baseline$/);
  await expect(page.getByRole("heading", { name: /baseline assessment/i })).toBeVisible();
});

test("Prevent dashboard without weekly", async ({ page }) => {
  const user = uniqueUser("flow3");

  await registerViaUi(page, user);
  await loginViaUi(page, user);
  await submitBaseline(page);

  await page.goto(`${APP_URL}/dashboard`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/weekly$/);
  await expect(page.getByRole("heading", { name: /weekly tracker/i })).toBeVisible();
});
