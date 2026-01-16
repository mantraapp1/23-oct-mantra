export default function CookiesPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Cookie Policy</h1>

            <div className="prose prose-lg max-w-none text-[var(--foreground)]">
                <p className="text-[var(--foreground-secondary)]">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-bold mt-8 mb-4">What Are Cookies?</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences and provide personalized experiences.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">How We Use Cookies</h2>

                <div className="space-y-4 mt-4">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                        <h3 className="font-semibold text-[var(--foreground)]">🔐 Essential Cookies</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                            Required for basic functionality like staying logged in and security features.
                        </p>
                    </div>

                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                        <h3 className="font-semibold text-[var(--foreground)]">📊 Analytics Cookies</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                            Help us understand how visitors use the site so we can improve it.
                        </p>
                    </div>

                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                        <h3 className="font-semibold text-[var(--foreground)]">⚙️ Preference Cookies</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                            Remember your settings like dark mode, font size, and reading progress.
                        </p>
                    </div>

                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                        <h3 className="font-semibold text-[var(--foreground)]">📺 Advertising Cookies</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                            Used to show relevant ads. This helps keep reading free and supports authors.
                        </p>
                    </div>
                </div>

                <h2 className="text-xl font-bold mt-8 mb-4">Managing Cookies</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    Most browsers let you control cookies through their settings. Note that disabling cookies may affect functionality:
                </p>
                <ul className="list-disc pl-6 text-[var(--foreground-secondary)] mt-4">
                    <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                    <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                    <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                    <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4">Third-Party Cookies</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    We use Google AdSense for advertising, which may set its own cookies. These are governed by Google's privacy policy.
                </p>
            </div>
        </div>
    );
}
