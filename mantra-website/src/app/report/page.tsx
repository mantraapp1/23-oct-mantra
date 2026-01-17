'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReportPage() {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // In real app, submit to backend
    };

    if (submitted) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center font-inter text-slate-800 min-h-screen">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                    <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted</h1>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                    Thank you for keeping our community safe. We will review your report shortly.
                </p>
                <Link
                    href="/"
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors inline-block text-sm"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-8 font-inter text-slate-800 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-transform text-slate-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-xl font-bold text-slate-900">Report Content</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <div className="text-xs text-amber-800 leading-relaxed">
                        Please provide accurate details. False reports may lead to account restrictions.
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Reason for reporting</label>
                    <div className="space-y-2">
                        {['Inappropriate Content', 'Spam or Advertising', 'Copyright Infringement', 'Hate Speech', 'Harassment', 'Other'].map((r) => (
                            <label key={r} className={`flex items-center px-4 py-3 rounded-xl border cursor-pointer transition-all ${reason === r
                                    ? 'bg-sky-50 border-sky-200 shadow-sm'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}>
                                <input
                                    type="radio"
                                    name="reason"
                                    value={r}
                                    checked={reason === r}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${reason === r ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                                    }`}>
                                    {reason === r && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                </div>
                                <span className={`text-sm font-medium ${reason === r ? 'text-sky-900' : 'text-slate-700'}`}>{r}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description (Optional)</label>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none placeholder:text-slate-400"
                        placeholder="Please provide any additional details..."
                    ></textarea>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={!reason}
                        className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold shadow-sm shadow-rose-200 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Submit Report
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 px-8">
                        By submitting this report, you agree to our Terms of Service regarding content reporting protocols.
                    </p>
                </div>
            </form>
        </div>
    );
}
