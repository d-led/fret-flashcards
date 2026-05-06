import { describe, expect, it } from "vitest";

import {
  applyMicSubmissionResult,
  shouldAttemptMicSubmission,
} from "../src/ts/modules/micDetectionState";

describe("mic submission state", () => {
  it("allows first submission when note has not been locked", () => {
    expect(shouldAttemptMicSubmission(null, 58, 1000, 0, 1000)).toBe(true);
  });

  it("throttles same-note resubmission after accepted submission", () => {
    const accepted = applyMicSubmissionResult(58, true, 1000);

    expect(
      shouldAttemptMicSubmission(
        accepted.displayedNoteId,
        58,
        1500,
        accepted.lastSubmissionTime,
        1000,
      ),
    ).toBe(false);

    expect(
      shouldAttemptMicSubmission(
        accepted.displayedNoteId,
        58,
        2101,
        accepted.lastSubmissionTime,
        1000,
      ),
    ).toBe(true);
  });

  it("clears lock immediately after rejected submission so retries are not stuck", () => {
    const rejected = applyMicSubmissionResult(58, false, 1000);

    expect(rejected.displayedNoteId).toBeNull();
    expect(rejected.lastSubmissionTime).toBe(0);

    // Regression: same stable note should still be eligible right away.
    expect(
      shouldAttemptMicSubmission(
        rejected.displayedNoteId,
        58,
        1001,
        rejected.lastSubmissionTime,
        1000,
      ),
    ).toBe(true);
  });

  it("never attempts submission for null current note", () => {
    expect(shouldAttemptMicSubmission(null, null, 1000, 0, 1000)).toBe(false);
    expect(shouldAttemptMicSubmission(58, null, 1000, 500, 1000)).toBe(false);
  });
});
