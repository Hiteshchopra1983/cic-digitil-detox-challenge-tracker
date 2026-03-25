import { test, expect, type Page } from "@playwright/test";
import jwt from "jsonwebtoken";

const APP_URL = process.env.E2E_APP_URL || "http://localhost:8080";

// Found from DB via `backend/scripts/listAdmins.js`
const ADMIN = {
  id: "be1fe6e1-6fa6-4c3d-bda3-454680845f6a",
  role: "admin"
};

function makeAdminJwt() {
  // Backend middleware verifies: jwt.verify(token, process.env.JWT_SECRET || "secret")
  return jwt.sign({ id: ADMIN.id, role: ADMIN.role }, "secret", {
    expiresIn: "30d"
  });
}

async function authAsAdmin(page: Page) {
  const token = makeAdminJwt();
  await page.addInitScript(({ token, ADMIN }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("participant_id", ADMIN.id);
    localStorage.setItem("role", ADMIN.role);
  }, { token, ADMIN });
}

test("Admin journey: /admin and key subpages", async ({ page }) => {
  await authAsAdmin(page);

  await page.goto(`${APP_URL}/admin`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Admin Dashboard/i })).toBeVisible();

  // Program Configuration
  await page.getByRole("button", { name: /Program Configuration/i }).click();
  await expect(page.getByRole("heading", { name: /Program Configuration/i })).toBeVisible();

  // CO2 Factors Configuration
  await page.getByRole("button", { name: /CO2 Configuration/i }).click();
  await expect(
    page.getByRole("heading", { name: /CO₂ Factor Configuration/i })
  ).toBeVisible();

  // Participant Administration
  await page.getByRole("button", { name: /Participant Administration/i }).click();
  await expect(page.getByRole("heading", { name: /Participant Management/i })).toBeVisible();
});

