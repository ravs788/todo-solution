import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ colorVar = '--navbar-text' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleClick = () => {
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      className="btn btn-link p-2 ms-2"
      style={{
        border: 'none',
        background: 'transparent',
        fontSize: '1.2rem',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, color 0.3s ease',
        color: `var(${colorVar})`
      }}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
