import React from "react";
import { useTheme } from "../context/ThemeContext";

const AIAnalysisSection = ({ title, content, iconColor, icon }) => {
  const { theme, isDarkMode } = useTheme();
  const borderColor = isDarkMode ? "border-gray-600" : "border-gray-300";
  return (
    <div className={`p-4 ${theme.bgPrimary} rounded-lg border ${borderColor}`}>
      <h3
        className={`flex items-center text-lg font-semibold mb-2 ${theme.textPrimary}`}
      >
        <span className={`mr-3 ${iconColor}`}>{icon}</span>
        {title}
      </h3>
      <p className={`${theme.textSecondary} whitespace-pre-wrap`}>{content}</p>
    </div>
  );
};
export default AIAnalysisSection;
