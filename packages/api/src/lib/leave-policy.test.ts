import { describe, expect, test } from "bun:test";

import { evaluateLeavePolicy } from "./leave-policy";

describe("evaluateLeavePolicy", () => {
  test("blocks concurrent absence cap", () => {
    const result = evaluateLeavePolicy({
      policy: { maxConcurrentAbsences: 2 },
      concurrentAbsences: 2,
      requestsThisYear: 0,
    });
    expect(result.allowed).toBe(false);
  });

  test("blocks yearly request cap", () => {
    const result = evaluateLeavePolicy({
      policy: { maxRequestsPerYear: 3 },
      concurrentAbsences: 0,
      requestsThisYear: 3,
    });
    expect(result.allowed).toBe(false);
  });

  test("allows override when caller can override", () => {
    const result = evaluateLeavePolicy({
      policy: { maxConcurrentAbsences: 1, maxRequestsPerYear: 1, requiresHrOverrideForSplit: true },
      concurrentAbsences: 1,
      requestsThisYear: 1,
      requestedParts: 2,
      overrideRequested: true,
      callerCanOverride: true,
    });
    expect(result.allowed).toBe(true);
  });
});
