import React from "react";
import { useTheme } from "../context/ThemeContext";

const Modal = ({ children, onClose }) => {
  const { theme } = useTheme();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm">
      <div
        className={`p-6 rounded-xl ${theme.shadow} w-full max-w-lg ${theme.bgPrimary} border ${theme.border} max-h-[90vh] overflow-y-auto`}
      >
        {children}
        <button
          onClick={onClose}
          className={`w-full mt-6 font-bold py-2 rounded-lg ${theme.accentBg} text-white`}
        >
          Close
        </button>
      </div>
    </div>
  );
};
export default Modal;
