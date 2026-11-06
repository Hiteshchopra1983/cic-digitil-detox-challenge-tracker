/**
 * DD 2.0 AI Companion — guided prompts only (no generative AI).
 * Matches wireframe: help navigate check-in / explain rules; does not invent numbers.
 */

export type CompanionCta = {
  label: string;
  to: string;
};

export type CompanionReply = {
  text: string;
  cta?: CompanionCta;
};

export type CompanionPrompt = {
  id: string;
  label: string;
  reply: CompanionReply;
};

export const COMPANION_GREETING =
  "Hi — I can help you check in on this week’s four actions or explain how progress works. Pick a prompt below.";

export const COMPANION_PROMPTS: CompanionPrompt[] = [
  {
    id: "start",
    label: "Where do I start?",
    reply: {
      text:
        "Open Weekly check-in. You’ll see four actions: Digital cleanup, Calmer inbox, Fewer notifications, and Limited streaming. Tap each card, pick a chip (or “Not this week”), then Save. About one minute.",
      cta: { label: "Open check-in →", to: "/check-in" }
    }
  },
  {
    id: "checkin",
    label: "Help me check in this week",
    reply: {
      text:
        "On My actions / check-in, expand any action and choose one chip. You can do all four, just one or two, or none. When you’re ready, tap Save this week — or Skip this week entirely if you need a pass.",
      cta: { label: "Open check-in →", to: "/check-in" }
    }
  },
  {
    id: "chips",
    label: "What do the chips mean?",
    reply: {
      text:
        "Chips are quick bands (light / solid / deep), not exact typing. Ranges are draft labels for now — pick the closest fit. “Not this week” skips that action without blocking the others."
    }
  },
  {
    id: "progress",
    label: "How does my progress work?",
    reply: {
      text:
        "This week shows how many of the four actions you reported. Start-to-date counts weeks you’ve checked in across the four-month challenge. Missed or skipped weeks don’t erase earlier progress.",
      cta: { label: "See my check-in →", to: "/check-in" }
    }
  },
  {
    id: "missed",
    label: "I missed a week — what now?",
    reply: {
      text:
        "That’s fine. Join anytime and pick up the current week. You’re not locked out, and you don’t have to backfill every gap — participate at your own pace.",
      cta: { label: "Continue this week →", to: "/check-in" }
    }
  },
  {
    id: "skip",
    label: "Can I skip a week?",
    reply: {
      text:
        "Yes. Use “Not this week” on individual actions, or Skip this week entirely at the bottom. A skip keeps you in the challenge; reminders can still bring you back next week.",
      cta: { label: "Go to check-in →", to: "/check-in" }
    }
  },
  {
    id: "reminders",
    label: "How do reminders work?",
    reply: {
      text:
        "Weekly email or WhatsApp reminders should open this app straight on the check-in screen (deep link). Sign in if needed — then you’re on this week’s actions."
    }
  },
  {
    id: "help",
    label: "Tips for the four actions",
    reply: {
      text:
        "Cleanup: delete unused files/downloads. Inbox: archive or unsubscribe. Notifications: mute noisy apps. Streaming: shorten or skip a session. Small steps count — any chip is enough for that action."
    }
  }
];

export function findPrompt(id: string): CompanionPrompt | undefined {
  return COMPANION_PROMPTS.find((p) => p.id === id);
}
