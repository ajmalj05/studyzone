import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
    _id: string;
    userId: string;
    name: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (userId: string, password: string, role: string) => Promise<UserRole>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (userId: string, password: string, role: string) => {
        try {
            const data = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ userId, password, role }),
            });

            const { access_token, ...userData } = data;

            setToken(access_token);
            setUser(userData);

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));

            return userData.role as UserRole;
        } catch (error: any) {
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
