export type LeavePolicyLimits = {
  maxConcurrentAbsences?: number | null;
  maxRequestsPerYear?: number | null;
  requiresHrOverrideForSplit?: boolean | null;
};

export type LeavePolicyEvaluationInput = {
  policy?: LeavePolicyLimits | null;
  concurrentAbsences: number;
  requestsThisYear: number;
  requestedParts?: number;
  overrideRequested?: boolean;
  callerCanOverride?: boolean;
};

export type LeavePolicyEvaluation =
  | { allowed: true; reason?: undefined }
  | { allowed: false; reason: string };

export function evaluateLeavePolicy(input: LeavePolicyEvaluationInput): LeavePolicyEvaluation {
  const policy = input.policy;
  const canOverride = Boolean(input.overrideRequested && input.callerCanOverride);

  if (!policy) {
    return { allowed: true };
  }

  if (
    policy.maxConcurrentAbsences != null &&
    input.concurrentAbsences >= policy.maxConcurrentAbsences &&
    !canOverride
  ) {
    return {
      allowed: false,
      reason: `Leave policy allows at most ${policy.maxConcurrentAbsences} concurrent absence(s) for this scope.`,
    };
  }

  if (
    policy.maxRequestsPerYear != null &&
    input.requestsThisYear >= policy.maxRequestsPerYear &&
    !canOverride
  ) {
    return {
      allowed: false,
      reason: `Leave policy allows at most ${policy.maxRequestsPerYear} request(s) per year.`,
    };
  }

  if (
    policy.requiresHrOverrideForSplit &&
    (input.requestedParts ?? 1) > 1 &&
    !canOverride
  ) {
    return {
      allowed: false,
      reason: "This leave policy requires HR override for split leave requests.",
    };
  }

  return { allowed: true };
}
