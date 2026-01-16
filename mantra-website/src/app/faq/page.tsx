'use client';

import { useState } from 'react';

const faqs = [
    {
        category: 'Reading',
        questions: [
            {
                q: 'Is it free to read novels on Mantra?',
                a: 'Yes! All novels on Mantra are free to read. We support authors through ad-based revenue sharing.'
            },
            {
                q: 'How do I save a novel to my library?',
                a: 'Click the "Add to Library" button on any novel page. You can access your saved novels from the Library tab.'
            },
            {
                q: 'Can I read offline?',
                a: 'Currently, offline reading is only available on our mobile app. Download it for iOS or Android.'
            }
        ]
    },
    {
        category: 'Writing',
        questions: [
            {
                q: 'How do I start publishing my novel?',
                a: 'Sign up for an account, go to Author Dashboard, and click "Create Novel". Fill in the details and start adding chapters!'
            },
            {
                q: 'Are there content guidelines?',
                a: 'Yes, please review our Content Policy. We allow most genres but prohibit plagiarism, hate speech, and illegal content.'
            },
            {
                q: 'How often should I update my novel?',
                a: 'We recommend at least 2-3 chapters per week for best reader engagement, but publish at your own pace.'
            }
        ]
    },
    {
        category: 'Earnings',
        questions: [
            {
                q: 'How do authors earn money?',
                a: 'Authors earn revenue from ad views on their published chapters. Earnings are calculated daily based on reader engagement.'
            },
            {
                q: 'What is the minimum withdrawal amount?',
                a: 'The minimum withdrawal is 100 XLM. Withdrawals are processed to your Stellar wallet.'
            },
            {
                q: 'When are earnings distributed?',
                a: 'Earnings are calculated and distributed daily at midnight UTC.'
            }
        ]
    },
    {
        category: 'Account',
        questions: [
            {
                q: 'How do I reset my password?',
                a: 'Click "Forgot password" on the login page and enter your email. We\'ll send a reset link.'
            },
            {
                q: 'Can I change my username?',
                a: 'Yes, go to Profile > Settings to change your username. Note that this may affect your author profile URL.'
            },
            {
                q: 'How do I delete my account?',
                a: 'Go to Profile > Account Settings and scroll to the bottom to find the delete account option. This action is irreversible.'
            }
        ]
    }
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const toggleFaq = (key: string) => {
        setOpenIndex(openIndex === key ? null : key);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Frequently Asked Questions</h1>
            <p className="text-[var(--foreground-secondary)] mb-8">
                Find answers to common questions about Mantra Novel
            </p>

            <div className="space-y-8">
                {faqs.map((category) => (
                    <div key={category.category}>
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">{category.category}</h2>
                        <div className="space-y-2">
                            {category.questions.map((faq, index) => {
                                const key = `${category.category}-${index}`;
                                const isOpen = openIndex === key;
                                return (
                                    <div
                                        key={key}
                                        className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleFaq(key)}
                                            className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-[var(--background-secondary)] transition-colors"
                                        >
                                            <span className="font-medium text-[var(--foreground)]">{faq.q}</span>
                                            <span className={`text-[var(--foreground-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </button>
                                        {isOpen && (
                                            <div className="px-4 pb-4 text-[var(--foreground-secondary)]">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
