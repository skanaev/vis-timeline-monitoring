import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/config/query';
import { updateProcessComment } from '../../shared/api/timelineApi';

export const useUpdateProcessCommentMutation = (businessDate: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { processId: number; comment: string }>({
    mutationFn: (payload: { processId: number; comment: string }) => {
      return updateProcessComment(businessDate, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.timeline(businessDate),
      });
    },
  });
};
