export const TIMELINE_NOW_MARKER_INTERVAL_MS = 30_000;
export const TIMELINE_WINDOW_PADDING_HOURS = 2;
export const TIMELINE_AXIS_STEP_HOURS = 1;
export const TIMELINE_ITEM_HEIGHT = 32;
export const TIMELINE_GROUP_HEIGHT = 44;
export const TIMELINE_DEFAULT_TIMEZONE = 'local';

export interface TimelineWindowConfig {
  paddingHours: number;
  axisStepHours: number;
  itemHeight: number;
  groupHeight: number;
  timezone: 'local';
}

export const timelineWindowConfig: TimelineWindowConfig = {
  paddingHours: TIMELINE_WINDOW_PADDING_HOURS,
  axisStepHours: TIMELINE_AXIS_STEP_HOURS,
  itemHeight: TIMELINE_ITEM_HEIGHT,
  groupHeight: TIMELINE_GROUP_HEIGHT,
  timezone: TIMELINE_DEFAULT_TIMEZONE,
};
