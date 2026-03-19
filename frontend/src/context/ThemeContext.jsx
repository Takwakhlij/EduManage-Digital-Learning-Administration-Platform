import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Obtenir la préférence de l'utilisateur ou la préférence système par défaut
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Appliquer la classe 'dark-theme' au body
        if (isDarkMode) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('app-theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('app-theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
