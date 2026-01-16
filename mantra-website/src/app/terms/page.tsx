import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Terms of Service</h1>

            <div className="prose prose-lg max-w-none text-[var(--foreground)]">
                <p className="text-[var(--foreground-secondary)]">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    By accessing and using Mantra Novel ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">2. User Accounts</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. You must be at least 13 years old to use this Service.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">3. Content Guidelines</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    Users may publish original content on the platform. You retain ownership of your content but grant Mantra Novel a non-exclusive license to display, distribute, and promote your work. Content must not violate copyright, contain hate speech, or be illegal in nature.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">4. Author Earnings</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    Authors may earn revenue through ad views on their published content. Earnings are distributed daily and can be withdrawn to a Stellar wallet. Minimum withdrawal amount applies. We reserve the right to adjust payment terms with notice.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">5. Prohibited Activities</h2>
                <ul className="list-disc pl-6 text-[var(--foreground-secondary)]">
                    <li>Plagiarism or copyright infringement</li>
                    <li>Harassment of other users</li>
                    <li>Attempting to manipulate view counts or earnings</li>
                    <li>Creating multiple accounts to abuse the system</li>
                    <li>Uploading malicious content</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4">6. Termination</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time through account settings.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">7. Disclaimer</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    The Service is provided "as is" without warranties of any kind. We are not liable for any damages arising from use of the Service.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">8. Contact</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    For questions about these Terms, please <Link href="/contact" className="text-[var(--primary)] hover:underline">contact us</Link>.
                </p>
            </div>
        </div>
    );
}
