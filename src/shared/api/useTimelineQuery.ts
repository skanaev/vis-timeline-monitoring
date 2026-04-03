import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { TIMELINE_POLLING_INTERVAL_MS, queryKeys } from '../config/query';
import type { TimelineResponse } from '../types/api';
import type { UiTimelineData } from '../types/ui';
import { mapTimelineResponse } from '../../entities/stage/model/mappers';
import { getTimeline } from './timelineApi';

export type UseTimelineQueryResult = UseQueryResult<UiTimelineData, Error> & {
  isBackgroundFetching: boolean;
};

export const useTimelineQuery = (businessDate: string): UseTimelineQueryResult => {
  const query = useQuery<TimelineResponse, Error, UiTimelineData>({
    queryKey: queryKeys.timeline(businessDate),
    queryFn: () => getTimeline(businessDate),
    select: mapTimelineResponse,
    refetchInterval: TIMELINE_POLLING_INTERVAL_MS,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    isBackgroundFetching: query.isFetching && !query.isLoading,
  };
};
