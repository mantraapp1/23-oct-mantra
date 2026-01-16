import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Privacy Policy</h1>

            <div className="prose prose-lg max-w-none text-[var(--foreground)]">
                <p className="text-[var(--foreground-secondary)]">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    We collect information you provide directly to us, including your email address, username, and any content you create. We also collect usage data such as pages visited, time spent reading, and device information.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 text-[var(--foreground-secondary)]">
                    <li>To provide and maintain the Service</li>
                    <li>To personalize your reading experience</li>
                    <li>To calculate and distribute author earnings</li>
                    <li>To send important updates and notifications</li>
                    <li>To improve our platform and develop new features</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4">3. Data Sharing</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    We do not sell your personal information. We may share data with service providers who help us operate the platform, such as hosting services and payment processors, under strict confidentiality agreements.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">4. Data Security</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    We implement industry-standard security measures to protect your data. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">5. Your Rights</h2>
                <ul className="list-disc pl-6 text-[var(--foreground-secondary)]">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your content</li>
                    <li>Opt-out of marketing communications</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4">6. Cookies</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    We use cookies to maintain your session, remember preferences, and analyze usage patterns. You can control cookies through your browser settings. See our <Link href="/cookies" className="text-[var(--primary)] hover:underline">Cookie Policy</Link> for details.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">7. Children's Privacy</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    The Service is not intended for users under 13. We do not knowingly collect data from children under 13.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">8. Contact</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    For privacy-related inquiries, please <Link href="/contact" className="text-[var(--primary)] hover:underline">contact us</Link>.
                </p>
            </div>
        </div>
    );
}
