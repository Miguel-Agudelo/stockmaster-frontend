import React, { createContext, useContext, useState, useCallback } from 'react';
import authService from '../features/auth/authService';

const AuthContext = createContext(null);

/**
 * Provee el estado de autenticación de forma reactiva a toda la app.
 * Reemplaza la lectura directa a localStorage en cada componente.
 */
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

    const login = useCallback(async (email, password) => {
        const data = await authService.login(email, password);
        setCurrentUser(authService.getCurrentUser());
        return data;
    }, []);

    const loginWithGoogle = useCallback(async (idToken) => {
        const data = await authService.loginWithGoogle(idToken);
        setCurrentUser(authService.getCurrentUser());
        return data;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setCurrentUser(null);
    }, []);

    const isAuthenticated = !!currentUser && authService.isUserAuthenticated();

    return (
        <AuthContext.Provider value={{ currentUser, isAuthenticated, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook para consumir el contexto de autenticación.
 * Uso: const { currentUser, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return ctx;
};