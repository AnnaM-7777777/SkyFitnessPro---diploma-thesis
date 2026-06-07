export const API_BASE = 'https://wedev-api.sky.pro/api/fitness';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fitness_token') : null;
    
    const headers: Record<string, string> = {
        'Content-Type': '',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (options?.headers) {
        Object.assign(headers, options.headers);
    }
    
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });
    
    const data = await res.json();
    
    if (!res.ok) {
        throw new Error(data.message || 'Ошибка запроса');
    }
    
    return data as T;
}