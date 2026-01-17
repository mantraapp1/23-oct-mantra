'use client';

import Link from 'next/link';

export default function SettingsPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-8 font-inter text-slate-800 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link href="/profile" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-transform text-slate-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-xl font-bold text-slate-900">Settings</h1>
            </div>

            <div className="space-y-8">
                {/* Account Section */}
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">Account</h2>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                            <span className="text-sm font-medium text-slate-700">Email</span>
                            <span className="text-sm text-slate-500">you@example.com</span>
                        </div>
                        <Link href="/settings/account" className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50 transition-all group">
                            <span className="text-sm font-medium text-slate-900 group-hover:text-sky-700">Account Settings</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-sky-500"><path d="m9 18 6-6-6-6" /></svg>
                        </Link>
                    </div>
                </div>

                {/* Preferences Section */}
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">Preferences</h2>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                                </div>
                                <span className="text-sm font-medium text-slate-900">Push Notifications</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                                </div>
                                <span className="text-sm font-medium text-slate-900">Dark Mode</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">About</h2>
                    <div className="space-y-2">
                        <Link href="/terms" className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-white group-hover:text-sky-600 transition-colors">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                </div>
                                <span className="text-sm font-medium text-slate-900 group-hover:text-sky-700">Terms of Service</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-sky-500"><path d="m9 18 6-6-6-6" /></svg>
                        </Link>
                        <Link href="/privacy" className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-white group-hover:text-sky-600 transition-colors">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <span className="text-sm font-medium text-slate-900 group-hover:text-sky-700">Privacy Policy</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-sky-500"><path d="m9 18 6-6-6-6" /></svg>
                        </Link>
                        <Link href="/content-policy" className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-white group-hover:text-sky-600 transition-colors">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                                </div>
                                <span className="text-sm font-medium text-slate-900 group-hover:text-sky-700">Community Guidelines</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-sky-500"><path d="m9 18 6-6-6-6" /></svg>
                        </Link>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <span className="text-sm font-medium text-slate-700">App Version</span>
                            <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">v1.0.0</span>
                        </div>
                    </div>
                </div>

                <button className="w-full py-3.5 rounded-xl border border-rose-100 bg-white text-rose-600 text-sm font-bold shadow-sm hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Log Out
                </button>
            </div>
        </div>
    );
}
