const raw = import.meta.env.VITE_API_URL;
if (!raw) {
    throw new Error('VITE_API_URL is not set. Add it to your .env (see .env.example).');
}
// Ensure base URL ends with /api so paths like /Classes become /api/Classes
const API_URL = raw.replace(/\/+$/, '').endsWith('/api') ? raw.replace(/\/+$/, '') : `${raw.replace(/\/+$/, '')}/api`;

export { API_URL };

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
        ...options,
        headers,
    });

    let data: unknown;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message =
            (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string')
                ? (data as { message: string }).message
                : response.status === 404
                    ? 'Not found. Check that VITE_API_URL points to your API (e.g. http://localhost:5000 or http://localhost:5000/api).'
                    : 'Something went wrong';
        throw new Error(message);
    }

    return data;
};
