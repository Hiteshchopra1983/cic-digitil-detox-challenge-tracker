const { pool } = require("../lib/db");
const { sameParticipantId } = require("../lib/participantAuth");
const { calculateWeeklyCO2Savings } = require("../lib/carbonCalculator");
const { weeklyPayloadFromRequestBody } = require("./weeklyPayload");
const {
  DD2_DURATION_WEEKS,
  ACTIONS,
  metricsFromActions,
  validateActions,
  countActionsDone,
  monthForWeek,
  suggestWeek,
  parseDd2Json
} = require("../lib/dd2Checkin");

async function ensureDd2Columns() {
  await pool.query(
    `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS dd2_checkin_json jsonb`
  );
  await pool.query(
    `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS dd2_skip_week boolean DEFAULT false`
  );
  await pool.query(
    `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
  );
  await pool.query(
    `ALTER TABLE program_config ADD COLUMN IF NOT EXISTS program_week_1_start_date date`
  );
}

async function loadProgramMeta() {
  const config = await pool.query(
    `SELECT program_week_1_start_date FROM program_config LIMIT 1`
  );
  return {
    programWeek1Start: config.rows[0]?.program_week_1_start_date ?? null,
    duration: DD2_DURATION_WEEKS
  };
}

async function loadWeekRows(participantId) {
  const result = await pool.query(
    `SELECT week_number, dd2_checkin_json, dd2_skip_week,
            COALESCE(counts_as_weekly_submission, true) AS counts
     FROM weekly_progress
     WHERE participant_id = $1`,
    [participantId]
  );
  return result.rows;
}

function buildWeekStatuses(rows, suggested, duration) {
  const byWeek = new Map();
  for (const row of rows) {
    byWeek.set(Number(row.week_number), row);
  }

  const list = [];
  for (let i = 1; i <= duration; i++) {
    const row = byWeek.get(i);
    let status = "open";
    if (row) {
      if (row.dd2_skip_week) status = "skipped";
      else if (row.dd2_checkin_json || row.counts) status = "done";
      else status = "open";
    } else if (i < suggested) {
      status = "skipped";
    }
    if (i === suggested && status !== "done") status = "current";
    list.push({ week: i, status });
  }
  return list;
}

/** GET /api/checkin/:participantId?week= */
async function getCheckin(req, res) {
  try {
    const participantId = String(req.params.participantId || "").trim();
    if (!sameParticipantId(req.user && req.user.id, participantId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await ensureDd2Columns();
    const { programWeek1Start, duration } = await loadProgramMeta();
    const rows = await loadWeekRows(participantId);

    const submittedWeeks = [];
    const skippedWeeks = [];
    let actionsLifetime = 0;

    for (const row of rows) {
      const wn = Number(row.week_number);
      if (row.dd2_skip_week) {
        skippedWeeks.push(wn);
        continue;
      }
      const parsed = parseDd2Json(row.dd2_checkin_json);
      if (parsed && parsed.actions) {
        submittedWeeks.push(wn);
        actionsLifetime += countActionsDone(parsed.actions);
      } else if (row.counts) {
        submittedWeeks.push(wn);
      }
    }

    const suggested_week = suggestWeek({
      programWeek1Start,
      submittedWeeks,
      skippedWeeks,
      duration
    });

    const requested = Number(req.query.week);
    const week_number =
      Number.isFinite(requested) && requested >= 1 && requested <= duration
        ? requested
        : suggested_week;

    const weekList = buildWeekStatuses(rows, suggested_week, duration);
    const month = monthForWeek(week_number);
    const monthWeeks = weekList.filter((w) => month.weeks.includes(w.week));

    const entryRow = rows.find((r) => Number(r.week_number) === week_number);
    const parsed = entryRow
      ? parseDd2Json(entryRow.dd2_checkin_json)
      : null;
    const actions = parsed?.actions || null;
    const skipWeek = !!(entryRow && entryRow.dd2_skip_week);

    const thisWeekDone = skipWeek
      ? 0
      : actions
        ? countActionsDone(actions)
        : 0;

    res.json({
      mode: "dd2",
      duration,
      actions_catalog: ACTIONS,
      suggested_week,
      week_number,
      month: {
        ...month,
        weeks: monthWeeks
      },
      weeks: weekList,
      this_week: {
        week: week_number,
        skipped: skipWeek,
        actions_done: thisWeekDone,
        actions_total: 4,
        actions,
        saved_at: parsed?.saved_at || null
      },
      start_to_date: {
        weeks_checked_in: submittedWeeks.length,
        weeks_skipped: skippedWeeks.length,
        actions_done: actionsLifetime
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load check-in" });
  }
}

/** POST /api/checkin — own-pace, no baseline, no calendar lock */
async function postCheckin(req, res) {
  try {
    const raw = req.body || {};
    const participant_id = String(raw.participant_id || "").trim();
    const week_number = Number(raw.week_number);
    const skip_week = !!raw.skip_week;

    if (!participant_id) {
      return res.status(400).json({ error: "participant_id is required" });
    }
    if (
      !Number.isFinite(week_number) ||
      week_number < 1 ||
      week_number > DD2_DURATION_WEEKS
    ) {
      return res.status(400).json({
        error: `week_number must be 1–${DD2_DURATION_WEEKS}`
      });
    }
    if (!sameParticipantId(req.user && req.user.id, participant_id)) {
      return res.status(403).json({
        error:
          "This submission does not match your logged-in account. Please log out and log in again."
      });
    }

    await ensureDd2Columns();

    let actions = raw.actions || null;
    if (skip_week) {
      actions = {
        cleanup: "Not this week",
        inbox: "Not this week",
        notif: "Not this week",
        streaming: "Not this week"
      };
    } else {
      const check = validateActions(actions);
      if (!check.ok) {
        return res.status(400).json({ error: check.error });
      }
    }

    const metrics = metricsFromActions(actions);
    const dd2Payload = {
      actions,
      skip_week,
      saved_at: new Date().toISOString()
    };

    const payload = weeklyPayloadFromRequestBody({
      ...metrics,
      participant_id,
      week_number
    });
    let co2_saved = 0;
    try {
      co2_saved = Number(
        Number(await calculateWeeklyCO2Savings(payload)).toFixed(4)
      );
    } catch (e) {
      console.warn("DD2 CO2 calc skipped:", e.message);
    }

    const existing = await pool.query(
      `SELECT id FROM weekly_progress
       WHERE participant_id = $1 AND week_number = $2`,
      [participant_id, week_number]
    );

    const countsAsSubmission = true;

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE weekly_progress SET
          gb_deleted = $1,
          downloads_avoided_gb = $2,
          streaming_reduction_minutes = $3,
          screen_time_change = $4,
          emails_reduced = $5,
          messages_reduced = $6,
          ritual_completed = $7,
          alumni_touchpoints = $8,
          llm_queries_reduced = $9,
          co2_saved = $10,
          screen_change = $11,
          streaming_reduction = $12,
          dd2_checkin_json = $13::jsonb,
          dd2_skip_week = $14,
          counts_as_weekly_submission = $15
         WHERE participant_id = $16 AND week_number = $17`,
        [
          metrics.storage_deleted_gb,
          metrics.downloads_avoided_gb,
          metrics.streaming_reduction_minutes,
          metrics.screen_time_change_minutes,
          metrics.emails_reduced,
          metrics.messages_reduced,
          metrics.ritual_completed,
          metrics.alumni_touchpoints,
          metrics.llm_queries_reduced,
          co2_saved,
          metrics.screen_time_change_minutes,
          metrics.streaming_reduction_minutes,
          JSON.stringify(dd2Payload),
          skip_week,
          countsAsSubmission,
          participant_id,
          week_number
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO weekly_progress (
          participant_id, week_number,
          gb_deleted, downloads_avoided_gb,
          streaming_reduction_minutes, screen_time_change,
          emails_reduced, messages_reduced,
          ritual_completed, alumni_touchpoints,
          llm_queries_reduced, co2_saved,
          screen_change, streaming_reduction,
          dd2_checkin_json, dd2_skip_week,
          counts_as_weekly_submission
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17
        )`,
        [
          participant_id,
          week_number,
          metrics.storage_deleted_gb,
          metrics.downloads_avoided_gb,
          metrics.streaming_reduction_minutes,
          metrics.screen_time_change_minutes,
          metrics.emails_reduced,
          metrics.messages_reduced,
          metrics.ritual_completed,
          metrics.alumni_touchpoints,
          metrics.llm_queries_reduced,
          co2_saved,
          metrics.screen_time_change_minutes,
          metrics.streaming_reduction_minutes,
          JSON.stringify(dd2Payload),
          skip_week,
          countsAsSubmission
        ]
      );
    }

    res.json({
      success: true,
      message: skip_week ? "Week skipped" : "Check-in saved",
      week_number,
      skip_week,
      actions_done: countActionsDone(actions),
      co2_saved,
      checkin: dd2Payload
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save check-in" });
  }
}

module.exports = { getCheckin, postCheckin };
