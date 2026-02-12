import { useState } from 'react';
import {
    ChevronLeft,
    Search,
    ChevronDown,
    MessageSquare,
    HelpCircle
} from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface FaqItem {
    id: string;
    category: string;
    question: string;
    answer: string;
    keywords: string;
}

const FAQ_DATA: FaqItem[] = [
    {
        id: '1',
        category: 'account',
        question: 'How do I create an account?',
        answer: 'Click on "Sign Up" on the login screen, enter your username, email, and password, then verify your email with the code sent to you. Once verified, you can set up your profile and start reading!',
        keywords: 'account create sign up register',
    },
    {
        id: '2',
        category: 'account',
        question: 'How do I reset my password?',
        answer: 'On the login screen, click "Forgot?" next to the password field. Enter your email address, and we\'ll send you a reset link. Follow the instructions in the email to set a new password.',
        keywords: 'password reset forgot change',
    },
    {
        id: '3',
        category: 'account',
        question: 'Can I delete my account?',
        answer: 'Yes. Go to Settings → Account → Delete Account. Please note that this action is permanent and cannot be undone. All your data, including your library and reading history, will be permanently deleted.',
        keywords: 'delete account remove close',
    },
    {
        id: '4',
        category: 'reading',
        question: 'How do I add novels to my library?',
        answer: 'On any novel detail page, tap the "Library" button below the cover image. The novel will be added to your library and you can access it anytime from the Library tab in the bottom navigation.',
        keywords: 'bookmark save library add button',
    },
    {
        id: '5',
        category: 'reading',
        question: 'Why do I see ads while reading?',
        answer: 'Ads help support our writers! All novels on Mantra are free to read. When you view ads, the revenue is distributed directly to the authors whose novels you\'re reading. This keeps the platform free while fairly compensating writers.',
        keywords: 'ads advertisements why',
    },
    {
        id: '6',
        category: 'reading',
        question: 'How do I change reading settings?',
        answer: 'While reading a chapter, you\'ll see reading controls at the top. You can adjust font size, font family, line spacing, brightness, and choose between Light, Sepia, or Dark themes.',
        keywords: 'font size theme change customize settings',
    },
    {
        id: '7',
        category: 'reading',
        question: 'How do I get notified about new chapters?',
        answer: 'Add the novel to your library and enable notifications in Settings → Preferences. You\'ll receive alerts whenever a new chapter is published for novels in your library.',
        keywords: 'notifications updates new chapter',
    },
    {
        id: '8',
        category: 'writing',
        question: 'How do I publish my own novel?',
        answer: 'Go to Profile → Author Dashboard → + Novel. Fill in your novel\'s title, synopsis, select genres, and upload a cover image. Once created, you can start adding chapters. Your novel will be visible to readers immediately after publishing your first chapter.',
        keywords: 'publish write author novel create',
    },
    {
        id: '9',
        category: 'writing',
        question: 'Can I edit chapters after publishing?',
        answer: 'Yes! Go to Author Dashboard → Your Novel → Edit, then select the chapter you want to edit. Make your changes and save. Readers will see the updated version immediately.',
        keywords: 'edit chapter update change',
    },
    {
        id: '10',
        category: 'writing',
        question: 'What are the cover image requirements?',
        answer: 'Cover images should be at least 800x1200 pixels (2:3 ratio), under 5MB, in JPG or PNG format. The image must be appropriate and not infringe on any copyrights.',
        keywords: 'cover image guidelines requirements',
    },
    {
        id: '11',
        category: 'earnings',
        question: 'How do authors earn money on Mantra?',
        answer: 'Authors earn when readers view ads while reading their novels. All ad revenue is distributed among writers based on how many ads readers watch on their content. The more readers engage with your novel, the more you earn!',
        keywords: 'earnings money monetize revenue ads',
    },
    {
        id: '12',
        category: 'earnings',
        question: 'What is Stellar (XLM)? Why cryptocurrency?',
        answer: 'Stellar (XLM) is a cryptocurrency that enables fast, low-cost international payments. We use Stellar to pay authors because it\'s instant, has minimal fees, and works globally—perfect for our international community of writers.',
        keywords: 'stellar xlm cryptocurrency crypto',
    },
    {
        id: '13',
        category: 'earnings',
        question: 'How are earnings calculated?',
        answer: 'Earnings are based on ad views on your novel. Each ad view generates revenue that\'s credited to your account in Stellar (XLM). You can track your ad views and earnings in real-time on your Author Dashboard.',
        keywords: 'payment calculate distribution how much',
    },
    {
        id: '14',
        category: 'earnings',
        question: 'How do I withdraw my Stellar (XLM) earnings?',
        answer: 'Go to Wallet → Withdraw. You\'ll need a Stellar wallet address to receive payments. You can create a free Stellar wallet using services like Lobstr, Solar Wallet, or any Stellar-compatible wallet. Enter your wallet address and withdraw your XLM instantly.',
        keywords: 'withdraw payout cash stellar xlm',
    },
    {
        id: '15',
        category: 'earnings',
        question: 'Is there a minimum withdrawal amount?',
        answer: 'Yes, the minimum withdrawal is 10 XLM to cover network fees. Once you reach this threshold, you can withdraw anytime. There are no withdrawal limits or fees charged by Mantra.',
        keywords: 'minimum withdraw threshold amount',
    },
    {
        id: '19',
        category: 'technical',
        question: 'The app keeps crashing. What should I do?',
        answer: 'Try these steps: 1) Force close and restart the app 2) Clear app cache in Settings 3) Update to the latest version 4) Restart your device 5) Reinstall the app. If issues persist, contact support with your device model and OS version.',
        keywords: 'app crash freeze bug error',
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'account', label: 'Account' },
    { id: 'reading', label: 'Reading' },
    { id: 'writing', label: 'Writing' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'technical', label: 'Technical' },
];

export default function FaqPage() {
    const { goBack, navigate } = useAppNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('all');

    const filteredFaqs = FAQ_DATA.filter((faq) => {
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
        const matchesSearch =
            searchQuery === '' ||
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.keywords.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="max-w-[1800px] mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => goBack()} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-foreground">FAQ</h1>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search for questions..."
                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm text-foreground placeholder:text-muted-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar mb-6">
                {CATEGORIES.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeCategory === category.id
                            ? 'bg-sky-500 text-white'
                            : 'bg-card border border-border text-foreground-secondary hover:border-foreground-muted hover:bg-background-secondary'
                            }`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq) => (
                        <div
                            key={faq.id}
                            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
                        >
                            <button
                                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-background-secondary transition-colors"
                            >
                                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground transition-transform ${expandedId === faq.id ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {expandedId === faq.id && (
                                <div className="px-5 pb-5 text-foreground-secondary text-sm leading-relaxed border-t border-border pt-4">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-card border border-border rounded-3xl">
                        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">No results found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or category</p>
                    </div>
                )}
            </div>

            <div className="mt-12 p-8 bg-card border border-border rounded-3xl text-center">
                <div className="w-12 h-12 bg-background-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <HelpCircle className="w-6 h-6 text-foreground-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Still need help?</h3>
                <p className="text-foreground-secondary mb-6 max-w-sm mx-auto">
                    Can't find the answer you're looking for? Please contact our support team.
                </p>
                <button
                    onClick={() => navigate('/contact')}
                    className="px-8 py-3 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition shadow-lg shadow-sky-200 dark:shadow-sky-900/30 flex items-center gap-2 mx-auto"
                >
                    <MessageSquare className="w-5 h-5" />
                    Contact Support
                </button>
            </div>
        </div>
    );
}
