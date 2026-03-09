import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase/client';
import {
    ChevronLeft,
    MessageSquare,
    Mail,
    AlertCircle,
    Send,
    Loader2
} from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

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
    const { goBack } = useAppNavigation();
    const { user } = useAuth();
    const { toast } = useToast();
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
            const { error } = await supabase
                .from('contact_submissions')
                .insert([
                    {
                        user_id: user?.id || null,
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject,
                        message: formData.message,
                        status: 'pending'
                    }
                ]);

            if (error) throw error;

            toast.success('Message sent successfully!');
            setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
        } catch (error) {
            toast.error('Failed to send message. Please try again.'); // Show error toast
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="max-w-[1800px] mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => goBack()} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm text-center">
                    <div className="w-12 h-12 bg-background-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-6 h-6 text-foreground-secondary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Live Support</h3>
                    <p className="text-xs text-foreground-secondary">Available Mon-Fri</p>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm text-center">
                    <div className="w-12 h-12 bg-background-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-6 h-6 text-foreground-secondary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Email Us</h3>
                    <p className="text-xs text-foreground-secondary truncate">mantranovels@protonmail.com</p>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm text-center">
                    <div className="w-12 h-12 bg-background-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-foreground-secondary" />
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

            {/* My Support Requests Section */}
            {user && (
                <UserMessagesList userId={user.id} />
            )}
        </div>
    );
}

function UserMessagesList({ userId }: { userId: string }) {
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('contact_submissions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (data) setMessages(data);
        };

        fetchMessages();

        // Subscribe to changes (real-time replies)
        const channel = supabase
            .channel('contact_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'contact_submissions',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === payload.new.id ? payload.new : msg
                    ));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    if (messages.length === 0) return null;

    return (
        <div className="max-w-4xl mx-auto mt-12 pt-12 border-t border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full bg-sky-500"></span>
                My Support History
            </h2>
            <div className="space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-lg">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                            <div>
                                <h3 className="font-bold text-white text-lg mb-1">{msg.subject}</h3>
                                <div className="text-xs text-slate-400 font-medium">
                                    {new Date(msg.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                            <span className={`self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${msg.status === 'replied'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                }`}>
                                {msg.status}
                            </span>
                        </div>

                        <p className="text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap pl-1 border-l-2 border-white/10">
                            {msg.message}
                        </p>

                        {/* Admin Reply */}
                        {msg.admin_reply && (
                            <div className="relative mt-4 overflow-hidden rounded-xl bg-sky-500/10 border border-sky-500/20 p-5">
                                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/50"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-xs text-sky-400 font-bold uppercase tracking-wide">
                                        Mantra Support
                                    </span>
                                    <span className="text-[10px] text-sky-500/60 ml-auto">
                                        {msg.replied_at && new Date(msg.replied_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-200 text-sm leading-relaxed pl-7">
                                    {msg.admin_reply}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
