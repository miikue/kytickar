import { API_BASE_URL } from '../config';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}`);
  }
  return (await response.json()) as T;
}

export async function apiSend<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || `HTTP ${response.status} for ${path}`);
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as T;
}

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload souboru selhal.');
  }

  const payload = (await response.json()) as { fileName: string };
  return payload.fileName;
}
