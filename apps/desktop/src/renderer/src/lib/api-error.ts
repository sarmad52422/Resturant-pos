import { AxiosError } from 'axios';

interface BackendErrorBody {
  error?: string;
  message?: string | string[];
  statusCode?: number;
}

export interface AppApiError {
  message: string;
  status?: number;
}

export function normalizeApiError(error: unknown, fallback = 'Request failed. Please try again.'): AppApiError {
  if (error instanceof AxiosError) {
    const body = error.response?.data as BackendErrorBody | string | undefined;
    return {
      message: messageFromBody(body) || error.message || fallback,
      status: error.response?.status,
    };
  }

  if (error instanceof Error) {
    return { message: messageFromError(error.message) || fallback };
  }

  return { message: fallback };
}

export function apiErrorMessage(error: unknown, fallback = 'Request failed. Please try again.') {
  return normalizeApiError(error, fallback).message;
}

function messageFromBody(body: BackendErrorBody | string | undefined): string | undefined {
  if (!body) return undefined;
  if (typeof body === 'string') return messageFromError(body);
  if (Array.isArray(body.message)) return body.message.join(' ');
  return body.message || body.error;
}

function messageFromError(message: string): string | undefined {
  try {
    const parsed = JSON.parse(message) as BackendErrorBody;
    return messageFromBody(parsed);
  } catch {
    return message;
  }
}
