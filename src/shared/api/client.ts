import axios, { AxiosError } from 'axios';
import { API_REQUEST_TIMEOUT_MS } from '../config/query';

const configuredApiBaseUrl = (import.meta.env.VITE_TIMELINE_API_BASE_URL ?? '').trim();
const apiBaseUrl = configuredApiBaseUrl || '/api';

export const isMockApiEnabled = (import.meta.env.VITE_TIMELINE_USE_MOCK ?? '').toLowerCase() === 'true';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: API_REQUEST_TIMEOUT_MS,
});

const toErrorMessage = (error: AxiosError<unknown>): string => {
  if (typeof error.response?.data === 'string' && error.response.data.trim().length > 0) {
    return error.response.data;
  }

  return error.message || 'Не удалось выполнить запрос к backend.';
};

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(new Error(toErrorMessage(error)));
    }

    return Promise.reject(new Error('Произошла неизвестная ошибка сети.'));
  },
);
