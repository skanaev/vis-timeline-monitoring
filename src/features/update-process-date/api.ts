import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/config/query';
import { updateProcessExecutionDate } from '../../shared/api/timelineApi';

export const useUpdateProcessExecutionDateMutation = (businessDate: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { processId: number; executionDate: string | null }>({
    mutationFn: (payload: { processId: number; executionDate: string | null }) => {
      return updateProcessExecutionDate(businessDate, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.timeline(businessDate),
      });
    },
  });
};
