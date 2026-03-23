export interface PlayerState {
  classId: string;
  /** resourceId → quantity owned */
  resources: Record<string, number>;
}

export function createPlayerState(classId: string): PlayerState {
  return { classId, resources: {} };
}

export function addResource(state: PlayerState, resourceId: string, qty = 1): PlayerState {
  return {
    ...state,
    resources: {
      ...state.resources,
      [resourceId]: (state.resources[resourceId] ?? 0) + qty,
    },
  };
}
