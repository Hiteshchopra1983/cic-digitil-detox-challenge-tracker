import { test, expect, type Browser, type Page } from "@playwright/test";

const APP_URL = process.env.E2E_APP_URL || "http://localhost:8080";
const BACKEND_URL = process.env.E2E_BACKEND_URL || "http://localhost:3000";

type Participant = {
  participant_id: string;
  token: string;
  role: string;
  email: string;
  password: string;
};

function decodeJwt(token: string) {
  const payload = token.split(".")[1];
  const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
  const decoded = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(decoded);
}

async function registerParticipant(
  email: string,
  password: string,
  name: string
): Promise<Participant> {
  const body = {
    name,
    email,
    password,
    country: "IN",
    consent: true
  };

  const res = await fetch(`${BACKEND_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (res.status !== 200) {
    const text = await res.text();
    throw new Error(`Register failed: ${res.status} ${text}`);
  }

  const json: any = await res.json();
  const role = decodeJwt(json.token)?.role || "participant";

  return {
    token: json.token,
    participant_id: json.participant_id,
    role,
    email,
    password
  };
}

async function openDirectChat(page: Page): Promise<Page> {
  const chatButton = page.getByRole("button", { name: /^Chat$/ });
  const popupPromise = page.waitForEvent("popup");
  await chatButton.click();
  const chatPage = await popupPromise;
  await chatPage.waitForLoadState("domcontentloaded");
  await expect(chatPage.getByText("Direct messages")).toBeVisible({ timeout: 30000 });
  return chatPage;
}

async function selectChatUser(page: Page, otherEmail: string) {
  const search = page.getByPlaceholder(/Search by name or email/i);
  await search.fill(otherEmail);

  const userButton = page
    .locator("button")
    .filter({ hasText: otherEmail })
    .first();
  await userButton.waitFor({ timeout: 30000 });
  await userButton.click();

  // Wait until thread input becomes enabled
  const msgInput = page.getByPlaceholder(/Type a message\.\.\./i);
  await expect(msgInput).toBeEnabled({ timeout: 30000 });
}

async function sendDirectMessage(page: Page, message: string) {
  const input = page.getByPlaceholder(/Type a message\.\.\./i);
  await input.fill(message);
  await page.getByRole("button", { name: "Send" }).click();
}

test("Direct chat between different participants", async ({ browser }) => {
  const password = "Aa!23456";
  const emailA = `e2e-chat-a-${Date.now()}@example.com`;
  const emailB = `e2e-chat-b-${Date.now()}@example.com`;

  const p1 = await registerParticipant(emailA, password, "Chat A");
  const p2 = await registerParticipant(emailB, password, "Chat B");

  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  await page1.addInitScript(
    ({ token, participant_id, role }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("participant_id", participant_id);
      localStorage.setItem("role", role);
    },
    { token: p1.token, participant_id: p1.participant_id, role: p1.role }
  );
  await page2.addInitScript(
    ({ token, participant_id, role }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("participant_id", participant_id);
      localStorage.setItem("role", role);
    },
    { token: p2.token, participant_id: p2.participant_id, role: p2.role }
  );

  await page1.goto(`${APP_URL}/profile`, { waitUntil: "networkidle" });
  await page2.goto(`${APP_URL}/profile`, { waitUntil: "networkidle" });

  const chat1 = await openDirectChat(page1);
  const chat2 = await openDirectChat(page2);

  await selectChatUser(chat1, p2.email);
  await selectChatUser(chat2, p1.email);

  // A -> B
  const messageAtoB = `Hello from ${p1.email} (${Date.now()})`;
  await sendDirectMessage(chat1, messageAtoB);
  await expect(chat1.getByText(/Saved — visible in this thread/i)).toBeVisible({ timeout: 20000 });

  // B should see it
  await page2.reload({ waitUntil: "networkidle" });
  const chat2b = await openDirectChat(page2);
  await selectChatUser(chat2b, p1.email);
  await expect(chat2b.getByText(messageAtoB)).toBeVisible({ timeout: 60000 });

  // B -> A reply
  const messageBtoA = `Reply from ${p2.email} (${Date.now()})`;
  await sendDirectMessage(chat2b, messageBtoA);

  // A should see the reply
  await page1.reload({ waitUntil: "networkidle" });
  const chat1b = await openDirectChat(page1);
  await selectChatUser(chat1b, p2.email);
  await expect(chat1b.getByText(messageBtoA)).toBeVisible({ timeout: 60000 });

  await ctx1.close();
  await ctx2.close();
});

