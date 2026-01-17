'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('general');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await supabase.from('contact_submissions').insert({
                name,
                email,
                subject,
                message,
            });
            setSuccess(true);
        } catch (error) {
            console.error('Error submitting contact form:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center font-inter text-slate-800">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                    <span className="text-3xl">✉️</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h1>
                <p className="text-slate-500 mb-8">
                    Thank you for contacting us. We'll get back to you to{' '}
                    <span className="font-semibold text-slate-700">{email}</span> within 24-48 hours.
                </p>
                <button
                    onClick={() => { setSuccess(false); setShowForm(false); }}
                    className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                    Send Another
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-8 font-inter text-slate-800 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link href="/profile" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-transform text-slate-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-xl font-bold text-slate-900">Contact Us</h1>
            </div>

            {!showForm ? (
                // Method Selection
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">How would you like to reach us?</label>
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50 active:scale-[0.98] transition-all group text-left shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0 text-sky-600 group-hover:scale-110 transition-transform">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                            </div>
                            <div className="flex-1">
                                <div className="text-base font-bold text-slate-900">Send Message</div>
                                <div className="text-xs text-slate-500 mt-0.5">Fill out the contact form</div>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="m9 18 6-6-6-6" /></svg>
                        </button>

                        <a
                            href="mailto:mantranovels@protonmail.com"
                            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/50 active:scale-[0.98] transition-all group text-left shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 group-hover:scale-110 transition-transform">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            </div>
                            <div className="flex-1">
                                <div className="text-base font-bold text-slate-900">Email Us</div>
                                <div className="text-xs text-slate-500 mt-0.5">mantranovels@protonmail.com</div>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                    </div>

                    {/* Info Section */}
                    <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 space-y-6">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm text-sky-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">Response Time</div>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    We aim to respond to all inquiries within 24-48 hours on business days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Contact Form
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <button
                        onClick={() => setShowForm(false)}
                        className="mb-6 text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Back to options
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Subject <span className="text-red-500">*</span></label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm appearance-none"
                                >
                                    <option value="general">General Inquiry</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="author">Author Support</option>
                                    <option value="payment">Payment Issue</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Message <span className="text-red-500">*</span></label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    rows={5}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm resize-none"
                                    placeholder="Tell us how we can help..."
                                />
                                <div className="text-[10px] text-slate-400 mt-1 text-right">Minimum 10 characters</div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-sky-500 text-white rounded-xl font-bold shadow-sm shadow-sky-200 hover:bg-sky-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <span>Send Message</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50 p-4 flex gap-3">
                        <svg className="w-5 h-5 text-sky-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        <div className="text-xs text-sky-900 font-medium">
                            We typically respond within 24-48 hours. Please check your spam folder if you don't hear from us.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
