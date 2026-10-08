import { describe, it, expect } from "vitest";
import { getApiOrigin } from "../lib/api";

describe("Chat / Socket.IO client wiring", () => {
  it("exposes a stable API origin (same as REST) for Socket.IO", () => {
    const origin = getApiOrigin();
    expect(typeof origin).toBe("string");
    expect(origin.length).toBeGreaterThan(0);
    expect(origin).toMatch(/^https?:\/\//);
    expect(origin.endsWith("/")).toBe(false);
  });
});
