import React, { createContext, useContext, useState } from 'react';
import { THEME_CLASSES } from '../utils/constants';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const theme = isDarkMode ? THEME_CLASSES.dark : THEME_CLASSES.light;
    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme: () => setIsDarkMode(p => !p), theme }}>
            <div className={`min-h-screen font-sans ${theme.bgPrimary}`}>{children}</div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);