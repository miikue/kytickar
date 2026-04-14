import { apiSend } from './http';

export type ActivityLogPayload = {
  eventType: string;
  section: string;
  label?: string | null;
  entityId?: number | null;
  details?: string | null;
};

export async function logActivity(payload: ActivityLogPayload) {
  return apiSend<null>('/api/activity-log', 'POST', payload);
}