import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    MessageSquare,
    Mail,
    CheckCircle,
    AlertCircle,
    Send,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SUBJECTS = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'author', label: 'Author/Writer Support' },
    { value: 'payment', label: 'Payment Issues' },
    { value: 'partnership', label: 'Partnership Inquiry' },
    { value: 'other', label: 'Other' },
];

export default function ContactPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSent, setIsSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'general',
        message: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.user_metadata?.full_name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.message.trim()) newErrors.message = 'Message is required';
        else if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSent(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center font-inter min-h-screen">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Message Sent!</h2>
                <p className="text-slate-600 mb-10 leading-relaxed text-lg">
                    Thank you for reaching out. We've received your message and will get back to you within 24-48 hours.
                </p>
                <button
                    onClick={() => navigate('/settings')}
                    className="px-10 py-4 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition shadow-lg shadow-sky-100"
                >
                    Back to Settings
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1800px] mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate('/settings')} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm text-center">
                    <div className="w-12 h-12 bg-sky-500/10 dark:bg-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-6 h-6 text-sky-500 dark:text-sky-400" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Live Support</h3>
                    <p className="text-xs text-foreground-secondary">Available Mon-Fri</p>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm text-center">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Email Us</h3>
                    <p className="text-xs text-foreground-secondary truncate">mantranovels@protonmail.com</p>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm text-center">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Report Bugs</h3>
                    <p className="text-xs text-foreground-secondary">Help us improve</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Name</label>
                            <input
                                type="text"
                                className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:ring-2 focus:ring-sky-500 outline-none`}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your name"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                            <input
                                type="email"
                                className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:ring-2 focus:ring-sky-500 outline-none`}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="name@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Subject</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-sky-500 outline-none appearance-none"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        >
                            {SUBJECTS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Message</label>
                        <textarea
                            rows={6}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.message ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:ring-2 focus:ring-sky-500 outline-none resize-none`}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="How can we help you?"
                        ></textarea>
                        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition shadow-lg shadow-sky-100 dark:shadow-sky-900/20 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {isLoading ? 'Sending...' : 'Send Message'}
                    </button>
                </div>
            </form>

            <p className="text-center text-muted-foreground text-xs mt-8 pb-10">
                Typical response time: 24-48 hours
            </p>
        </div>
    );
}
