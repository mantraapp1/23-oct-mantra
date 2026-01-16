'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('general');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        await supabase.from('contact_submissions').insert({
            name,
            email,
            subject,
            message,
        });

        setSuccess(true);
        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✉️</span>
                </div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Message Sent!</h1>
                <p className="text-[var(--foreground-secondary)]">
                    Thank you for contacting us. We'll get back to you soon.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Contact Us</h1>
            <p className="text-[var(--foreground-secondary)] mb-8">
                Have a question or feedback? We'd love to hear from you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Subject
                    </label>
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                        <option value="general">General Inquiry</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                        <option value="author">Author Support</option>
                        <option value="payment">Payment Issue</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={6}
                        className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                        placeholder="Tell us how we can help..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Sending...' : 'Send Message'}
                </button>
            </form>
        </div>
    );
}
