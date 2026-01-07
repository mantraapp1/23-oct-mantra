import React, { useState, useEffect } from "react";
import { Toggle } from "./ui/toggle";

export const SettingsScreen = () => {
    const [pushNotifications, setPushNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // Apply dark mode class to body/html
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background-100 text-gray-1000 dark:bg-background-200 dark:text-gray-1000 transition-colors duration-300">
            <div className="sticky top-0 bg-background-100 dark:bg-background-200 z-40 border-b border-gray-alpha-400">
                <div className="px-4 py-3 flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-100 active:scale-95 text-gray-1000 dark:text-gray-1000">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div className="text-base font-semibold">Settings</div>
                </div>
            </div>
            <div className="px-4 pt-4 pb-24 space-y-6">
                <div>
                    <div className="text-sm font-semibold mb-2 text-secondary">Account</div>
                    <div className="space-y-2">
                        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-alpha-400 hover:bg-gray-100 dark:hover:bg-gray-100">
                            <span className="text-sm">Email</span>
                            <span className="text-xs text-secondary">you@example.com</span>
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-alpha-400 hover:bg-gray-100 dark:hover:bg-gray-100">
                            <span className="text-sm">Account Settings</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                </div>
                <div>
                    <div className="text-sm font-semibold mb-2 text-secondary">Preferences</div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-alpha-400">
                            <span className="text-sm">Push Notifications</span>
                            <Toggle
                                checked={pushNotifications}
                                onChange={() => setPushNotifications(!pushNotifications)}
                                size="small"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-alpha-400">
                            <span className="text-sm">Dark Mode</span>
                            <Toggle
                                checked={darkMode}
                                onChange={() => setDarkMode(!darkMode)}
                                size="small"
                                color="blue"
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <div className="text-sm font-semibold mb-2 text-secondary">About</div>
                    <div className="space-y-2">
                        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-alpha-400 hover:bg-gray-100 dark:hover:bg-gray-100">
                            <span className="text-sm">Terms of Service</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-alpha-400 hover:bg-gray-100 dark:hover:bg-gray-100">
                            <span className="text-sm">Privacy Policy</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-alpha-400 hover:bg-gray-100 dark:hover:bg-gray-100">
                            <span className="text-sm">Version</span>
                            <span className="text-xs text-secondary">1.0.0</span>
                        </button>
                    </div>
                </div>
                <button className="w-full py-2.5 rounded-xl border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-100/10">Log Out</button>
            </div>
        </div>
    );
};
