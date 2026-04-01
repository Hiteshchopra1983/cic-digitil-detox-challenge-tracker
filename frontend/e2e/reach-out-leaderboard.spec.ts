import { test, expect, type APIRequestContext } from "@playwright/test";

const BACKEND = process.env.E2E_BACKEND_URL || "http://localhost:3000";
const APP = process.env.E2E_APP_URL || process.env.E2E_BASE_URL || "http://localhost:8080";

function makeUser(prefix: string) {
  const s = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    name: `${prefix} ${s}`,
    email: `${prefix.toLowerCase()}.${s}@e2e-reach.test`,
    password: "Aa!23456",
    country: "US"
  };
}

async function register(
  request: APIRequestContext,
  u: ReturnType<typeof makeUser>
) {
  const res = await request.post(`${BACKEND}/api/register`, {
    data: {
      name: u.name,
      email: u.email,
      password: u.password,
      country: u.country,
      consent: true
    }
  });
  expect(res.ok(), `register failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  return res.json() as Promise<{ token: string; participant_id: string }>;
}

async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${BACKEND}/api/login`, {
    data: { email, password }
  });
  expect(res.ok(), `login failed: ${await res.text()}`).toBeTruthy();
  return res.json() as Promise<{ token: string; participant_id: string }>;
}

async function postBaseline(
  request: APIRequestContext,
  token: string,
  participantId: string
) {
  const res = await request.post(`${BACKEND}/api/baseline`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      participant_id: participantId,
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
    }
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

function weeklyPayload(
  participantId: string,
  week: number,
  reachOut?: string
) {
  return {
    participant_id: participantId,
    week_number: week,
    storage_deleted_gb: 2,
    downloads_avoided_gb: 1,
    streaming_reduction_minutes: 30,
    screen_time_change_minutes: 15,
    emails_reduced: 0,
    messages_reduced: 0,
    ritual_completed: false,
    alumni_touchpoints: 1,
    tiktok_reduction_minutes: 0,
    instagram_reduction_minutes: 0,
    facebook_reduction_minutes: 0,
    youtube_reduction_minutes: 0,
    reach_out_emails: reachOut ?? ""
  };
}

async function postWeekly(
  request: APIRequestContext,
  token: string,
  body: ReturnType<typeof weeklyPayload>
) {
  const res = await request.post(`${BACKEND}/api/weekly`, {
    headers: { Authorization: `Bearer ${token}` },
    data: body
  });
  return res;
}

test.describe("Reach-out emails API edge cases", () => {
  test("registered peer counts once; unknown email does not; self does not; duplicate counts once; case-insensitive", async ({
    request
  }) => {
    const alpha = makeUser("alpha");
    const beta = makeUser("beta");
    const a = await register(request, alpha);
    const b = await register(request, beta);

    await postBaseline(request, a.token, a.participant_id);
    await postBaseline(request, b.token, b.participant_id);

    // Peer registered → count 1
    let res = await postWeekly(
      request,
      a.token,
      weeklyPayload(a.participant_id, 1, beta.email)
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    let j = await res.json();
    expect(j.reach_out_registered_count).toBe(1);

    // Unknown emails only → 0
    res = await postWeekly(
      request,
      a.token,
      weeklyPayload(a.participant_id, 2, "ghost-not-real@e2e-reach.test, another@fake.invalid")
    );
    expect(res.ok()).toBeTruthy();
    j = await res.json();
    expect(j.reach_out_registered_count).toBe(0);

    // Self only → 0 (cannot match own account)
    res = await postWeekly(
      request,
      a.token,
      weeklyPayload(a.participant_id, 3, alpha.email)
    );
    expect(res.ok()).toBeTruthy();
    j = await res.json();
    expect(j.reach_out_registered_count).toBe(0);

    // Duplicate beta twice → still 1
    res = await postWeekly(
      request,
      a.token,
      weeklyPayload(a.participant_id, 4, `${beta.email}, ${beta.email}`)
    );
    expect(res.ok()).toBeTruthy();
    j = await res.json();
    expect(j.reach_out_registered_count).toBe(1);

    // Uppercase variant of beta email
    const upper = beta.email.toUpperCase();
    res = await postWeekly(
      request,
      a.token,
      weeklyPayload(a.participant_id, 5, upper)
    );
    expect(res.ok()).toBeTruthy();
    j = await res.json();
    expect(j.reach_out_registered_count).toBe(1);

    // Mix: beta + unknown + alpha(self)
    res = await postWeekly(
      request,
      a.token,
      weeklyPayload(
        a.participant_id,
        6,
        `${beta.email}, nobody-here@e2e-reach.test, ${alpha.email}`
      )
    );
    expect(res.ok()).toBeTruthy();
    j = await res.json();
    expect(j.reach_out_registered_count).toBe(1);
  });
});

test.describe("Leaderboard reach-out weighting", () => {
  test("higher score when reach-outs match registered participants (same CO₂)", async ({
    request
  }) => {
    const leader = makeUser("ldr");
    const invited = makeUser("inv");
    const plain = makeUser("pln");

    const L = await register(request, leader);
    const I = await register(request, invited);
    const P = await register(request, plain);

    for (const x of [L, I, P]) {
      await postBaseline(request, x.token, x.participant_id);
    }

    const same = {
      storage_deleted_gb: 5,
      downloads_avoided_gb: 2,
      streaming_reduction_minutes: 60,
      screen_time_change_minutes: 30,
      emails_reduced: 0,
      messages_reduced: 0,
      ritual_completed: false,
      alumni_touchpoints: 0,
      tiktok_reduction_minutes: 0,
      instagram_reduction_minutes: 0,
      facebook_reduction_minutes: 0,
      youtube_reduction_minutes: 0
    };

    await postWeekly(request, L.token, {
      participant_id: L.participant_id,
      week_number: 1,
      ...same,
      reach_out_emails: `${invited.email}, ${plain.email}`
    });
    await postWeekly(request, I.token, {
      participant_id: I.participant_id,
      week_number: 1,
      ...same,
      reach_out_emails: ""
    });
    await postWeekly(request, P.token, {
      participant_id: P.participant_id,
      week_number: 1,
      ...same,
      reach_out_emails: ""
    });

    const lbRes = await request.get(`${BACKEND}/api/leaderboard`);
    expect(lbRes.ok(), await lbRes.text()).toBeTruthy();
    const board = (await lbRes.json()) as Array<{
      id: string;
      co2_saved: number;
      reach_out_matches: number;
      leaderboard_score: number;
    }>;

    const rowL = board.find((r) => r.id === L.participant_id);
    const rowI = board.find((r) => r.id === I.participant_id);
    const rowP = board.find((r) => r.id === P.participant_id);

    expect(rowL, "leader on board").toBeTruthy();
    expect(rowI).toBeTruthy();
    expect(rowP).toBeTruthy();

    expect(rowL!.reach_out_matches).toBe(2);
    expect(rowI!.reach_out_matches).toBe(0);
    expect(rowP!.reach_out_matches).toBe(0);

    expect(rowL!.leaderboard_score).toBeGreaterThan(rowI!.leaderboard_score);
    expect(rowI!.leaderboard_score).toBeCloseTo(rowP!.leaderboard_score, 5);
    expect(rowL!.co2_saved).toBeCloseTo(rowI!.co2_saved, 3);

    const bonusPerMatch =
      rowL!.reach_out_matches > 0
        ? (rowL!.leaderboard_score - rowL!.co2_saved) / rowL!.reach_out_matches
        : 0;
    expect(bonusPerMatch).toBeGreaterThan(0);
    expect(rowL!.leaderboard_score).toBeCloseTo(
      rowL!.co2_saved + bonusPerMatch * rowL!.reach_out_matches,
      4
    );
  });
});

test.describe("Weekly page UI — reach-out field", () => {
  test("participant can enter comma-separated emails and save", async ({ page }) => {
    const u = makeUser("uiweekly");
    const res = await page.request.post(`${BACKEND}/api/register`, {
      data: {
        name: u.name,
        email: u.email,
        password: u.password,
        country: u.country,
        consent: true
      }
    });
    expect(res.ok()).toBeTruthy();
    const reg = await res.json();

    await page.request.post(`${BACKEND}/api/baseline`, {
      headers: { Authorization: `Bearer ${reg.token}` },
      data: {
        participant_id: reg.participant_id,
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
      }
    });

    await page.addInitScript((t) => {
      localStorage.setItem("token", t.token);
      localStorage.setItem("participant_id", t.participant_id);
      localStorage.setItem("role", "participant");
    }, { token: reg.token, participant_id: reg.participant_id });

    await page.goto(`${APP}/weekly`, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: /weekly tracker/i })).toBeVisible();

    await page
      .getByRole("textbox", { name: /Invite emails \(comma-separated\)/i })
      .fill("ally1@e2e-reach.test, ally2@e2e-reach.test");

    const trackerCard = page
      .getByRole("heading", { name: /weekly tracker/i })
      .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
    const numericInputs = trackerCard.locator("input.input:not([type='checkbox'])");
    await numericInputs.nth(0).fill("1");
    await numericInputs.nth(1).fill("1");
    await numericInputs.nth(2).fill("10");
    await numericInputs.nth(3).fill("5");

    page.once("dialog", (d) => d.accept());

    await page.getByRole("button", { name: /save this week/i }).click();

    await expect
      .poll(async () => {
        const r = await page.request.get(
          `${BACKEND}/api/weekly/entry/${reg.participant_id}/1`,
          { headers: { Authorization: `Bearer ${reg.token}` } }
        );
        if (!r.ok()) return "";
        const j = await r.json();
        return String(j?.entry?.reach_out_emails ?? "");
      })
      .toContain("ally1@e2e-reach.test");
  });
});
