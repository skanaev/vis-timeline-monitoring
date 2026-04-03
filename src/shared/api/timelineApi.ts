import type {
  TimelineResponse,
  UpdateProcessCommentRequest,
  UpdateProcessExecutionDateRequest,
} from '../types/api';
import {
  getMockTimeline,
  updateMockProcessComment,
  updateMockProcessExecutionDate,
} from './mockTimeline';

export const getTimeline = async (businessDate: string): Promise<TimelineResponse> => {
  return getMockTimeline(businessDate);
};

export const updateProcessComment = async (
  businessDate: string,
  request: UpdateProcessCommentRequest,
): Promise<void> => {
  return updateMockProcessComment(businessDate, request);
};

export const updateProcessExecutionDate = async (
  businessDate: string,
  request: UpdateProcessExecutionDateRequest,
): Promise<void> => {
  return updateMockProcessExecutionDate(businessDate, request);
};
