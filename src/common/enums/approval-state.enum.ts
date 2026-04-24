export enum ApprovalState {
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECT = 'REJECT',
}

/**
 * Check if approval state is a final state (cannot be changed)
 * Final states: APPROVED, REJECT
 * Non-final state: WAITING_APPROVAL
 */
export function isFinalApprovalState(state: ApprovalState): boolean {
  return state === ApprovalState.APPROVED || state === ApprovalState.REJECT;
}
