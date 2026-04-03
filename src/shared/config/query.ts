export const TIMELINE_POLLING_INTERVAL_MS = 30_000;
export const API_REQUEST_TIMEOUT_MS = 15_000;

export const queryKeys = {
  timeline: (businessDate: string) => ['timeline', businessDate] as const,
};
