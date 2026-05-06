export interface MicCarryoverState {
  active: boolean;
  carryoverNoteId: number | null;
}

export function createCarryoverGuard(lastDetectedNoteId: number | null): MicCarryoverState {
  return {
    active: lastDetectedNoteId !== null,
    carryoverNoteId: lastDetectedNoteId,
  };
}

export function updateCarryoverGuard(
  state: MicCarryoverState,
  currentNoteId: number | null,
): MicCarryoverState {
  if (!state.active) return state;
  if (currentNoteId === null || currentNoteId !== state.carryoverNoteId) {
    return { active: false, carryoverNoteId: state.carryoverNoteId };
  }
  return state;
}

export function shouldSuppressForCarryover(
  state: MicCarryoverState,
  currentNoteId: number | null,
): boolean {
  return state.active && currentNoteId !== null && currentNoteId === state.carryoverNoteId;
}

export interface MicSubmissionState {
  displayedNoteId: number | null;
  lastSubmissionTime: number;
}

export function shouldAttemptMicSubmission(
  displayedNoteId: number | null,
  currentNoteId: number | null,
  now: number,
  lastSubmissionTime: number,
  minResubmissionDelayMs: number,
): boolean {
  if (currentNoteId === null) return false;
  if (displayedNoteId !== currentNoteId) return true;
  return now - lastSubmissionTime > minResubmissionDelayMs;
}

export function applyMicSubmissionResult(
  currentNoteId: number,
  accepted: boolean,
  now: number,
): MicSubmissionState {
  if (accepted) {
    return {
      displayedNoteId: currentNoteId,
      lastSubmissionTime: now,
    };
  }

  return {
    displayedNoteId: null,
    lastSubmissionTime: 0,
  };
}
