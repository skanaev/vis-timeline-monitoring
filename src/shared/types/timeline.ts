import type {
  TimelineEventPropertiesResult,
  TimelineGroup,
  TimelineItem,
  TimelineOptions,
} from 'vis-timeline/types';

export type TimelineEntityType = 'stage' | 'process';

export type TimelineItemVariant = 'planned' | 'actual';

export type TimelineColorVariant = 'default' | 'active' | 'warning' | 'danger' | 'success';

export type DelayState = 'on-time' | 'delayed' | 'unknown';

export interface SelectedItemState {
  entityType: TimelineEntityType;
  entityId: number;
}

export interface TimelineItemMeta {
  entityType: TimelineEntityType;
  entityId: number;
  variant: TimelineItemVariant;
  colorVariant: TimelineColorVariant;
  isDelayed: boolean;
}

export interface TimelineGroupModel extends TimelineGroup {
  id: string;
  content: string;
  nestedGroups?: string[];
}

export interface TimelineItemModel extends TimelineItem {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
  meta: TimelineItemMeta;
}

export interface TimelineWindow {
  start: Date;
  end: Date;
}

export interface TimelineBoardModel {
  groups: TimelineGroupModel[];
  items: TimelineItemModel[];
  options: TimelineOptions;
  window: TimelineWindow;
}

export type TimelineClickEvent = Pick<TimelineEventPropertiesResult, 'item' | 'what'>;

export interface TimelineSelectEvent {
  items?: Array<string | number>;
}
