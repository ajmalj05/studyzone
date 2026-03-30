const raw = import.meta.env.VITE_API_URL;
if (!raw) {
    throw new Error('VITE_API_URL is not set. Add it to your .env (see .env.example).');
}
// Ensure base URL ends with /api so paths like /Classes become /api/Classes
const API_URL = raw.replace(/\/+$/, '').endsWith('/api') ? raw.replace(/\/+$/, '') : `${raw.replace(/\/+$/, '')}/api`;

export { API_URL };

// Helper function to check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
    try {
        // JWT tokens have 3 parts separated by dots: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return true; // Invalid token format

        // Decode the payload (middle part)
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if exp exists and is in the past
        if (payload.exp) {
            // exp is in seconds, Date.now() is in milliseconds
            return payload.exp * 1000 < Date.now();
        }
        
        return false; // No expiration, treat as valid
    } catch {
        return true; // Invalid token, treat as expired
    }
};

// Helper to logout and redirect
const handleAuthFailure = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');

    // Check token expiration before making API call
    if (token && isTokenExpired(token)) {
        handleAuthFailure();
        throw new Error('Session expired. Please login again.');
    }

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

    // Handle 401 Unauthorized - token expired or invalid (fallback)
    if (response.status === 401) {
        handleAuthFailure();
        throw new Error('Session expired. Please login again.');
    }

    let data: unknown;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        let message: string;
        if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
            message = (data as { message: string }).message;
        } else if (typeof data === 'string' && data) {
            message = data;
        } else {
            message = 'Please try again. If the issue continues, please contact the development team.';
        }
        throw new Error(message);
    }

    return data;
};