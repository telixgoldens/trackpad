import React from "react";
import { useTheme } from "../context/ThemeContext";

const Sidebar = ({
  currentView,
  setView,
  walletConnected,
  connectWallet,
  isSidebarOpen,
  setSidebarOpen,
}) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z",
    },
    {
      id: "watchlist",
      label: "Watchlist",
      icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      id: "swap",
      label: "Swap & Bridge",
      icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    },
    {
      id: "activity",
      label: "Activity",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      id: "recap",
      label: "Daily Briefing",
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      id: "reports",
      label: "Reports",
      icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
  ];
  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 ${
          theme.bgPrimary
        } border-r ${theme.border} transition-transform lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <h1 className={`text-2xl font-bold mb-8 ${theme.accentText}`}>
            Trackpad
          </h1>
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center w-full p-3 rounded-lg font-medium transition ${
                  currentView === item.id
                    ? `${theme.accentBg} text-white`
                    : `${theme.textPrimary} hover:${theme.bgSecondary}`
                }`}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={item.icon}
                  />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={connectWallet}
              className={`w-full py-2 mb-2 rounded-lg font-bold ${
                walletConnected
                  ? "bg-emerald-500 text-white"
                  : `${theme.bgSecondary} ${theme.textPrimary}`
              }`}
            >
              {walletConnected ? "Connected" : "Connect Wallet"}
            </button>
            <button
              onClick={toggleTheme}
              className={`w-full py-2 rounded-lg text-sm ${theme.textSecondary} hover:${theme.textPrimary}`}
            >
              {isDarkMode ? "☀ Light" : "☾ Dark"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
