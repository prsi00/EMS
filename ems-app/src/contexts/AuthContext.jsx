import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('ems_user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    // Optionally fetch fresh user data
                    const { data, error } = await supabase
                        .from('employees')
                        .select('*')
                        .eq('id', parsedUser.id)
                        .single();

                    if (data && !error) {
                        setUser(data);
                        localStorage.setItem('ems_user', JSON.stringify(data));
                    } else {
                        setUser(null);
                        localStorage.removeItem('ems_user');
                    }
                } catch (err) {
                    console.error('Error restoring session:', err);
                    setUser(null);
                    localStorage.removeItem('ems_user');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (phone, dob) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('phone', phone)
                .eq('dob', dob)
                .single();

            if (error || !data) {
                throw new Error('Invalid phone number or date of birth');
            }

            setUser(data);
            localStorage.setItem('ems_user', JSON.stringify(data));
            return { success: true, user: data };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ems_user');
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
